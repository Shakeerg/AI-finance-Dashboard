#!/usr/bin/env node
/*
  FINA backend end-to-end test.

  1. Start the server in one terminal:   node server.js
  2. Run this in another terminal:       node test-backend.js

  Needs the real MongoDB, Redis and Gemini key from your .env (it sends
  a handful of real messages through the whole pipeline).
  Optional, for the live-push checks:    npm i -D socket.io-client

  Other port:   $env:BASE_URL="http://127.0.0.1:5001"; node test-backend.js

  Rate limits: the server allows 10 login/register calls and 100 list calls per
  15 minutes per IP. If you re-run many times, restart the server to reset them.
*/

const BASE = (process.env.BASE_URL || "http://127.0.0.1:5001").replace(/\/+$/, "");
const API = `${BASE}/api/v1`;

if (typeof fetch !== "function") {
  console.error("This script needs Node 18 or newer (global fetch).");
  process.exit(1);
}

let ioClient = null;
try {
  ioClient = require("socket.io-client").io;
} catch {
  /* optional */
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let passes = 0;
let failures = 0;
const pass = (msg) => {
  passes += 1;
  console.log(`  PASS  ${msg}`);
};
const fail = (msg, extra) => {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
  if (extra !== undefined) {
    console.log("        ", typeof extra === "string" ? extra : JSON.stringify(extra));
  }
};
const check = (cond, msg, extra) => (cond ? pass(msg) : fail(msg, extra));
const section = (title) => console.log(`\n${title}`);

async function call(method, path, { token, deviceKey, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (deviceKey) headers["x-device-key"] = deviceKey;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no JSON body */
  }
  return { status: res.status, json };
}

async function waitFor(fn, { timeoutMs = 60_000, everyMs = 4_000 } = {}) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const value = await fn();
    if (value) return value;
    await sleep(everyMs);
  }
  return null;
}

const listAll = async (token) =>
  (await call("GET", "/transactions?limit=100", { token })).json?.transactions ?? [];

const debitTotal = async (token) => {
  const r = await call("GET", "/transactions/stats", { token });
  const debit = r.json?.stats?.find((s) => s._id === "debit");
  return { total: debit?.grandTotal ?? 0, reviewCount: r.json?.reviewCount };
};

(async () => {
  console.log(`Testing ${BASE}`);

  /* ---------------------------------------------------------- */
  section("1. Server, error handling, signup");

  try {
    const health = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(8_000) });
    check(health.status === 200, "GET /health returns 200");
  } catch (err) {
    console.error(`\nCannot reach ${BASE}. Is the server running? (${err.message})`);
    process.exit(1);
  }

  const stamp = Date.now();
  const email = `fina-smoke-${stamp}@example.com`;
  const password = "Smoke-Test-123";

  let r = await call("POST", "/auth/register", { body: { email, password } });
  check(
    r.status === 400 && /name/i.test(r.json?.message || ""),
    "signup without a name -> 400 with a clear message (not a 500)",
    r
  );

  r = await call("POST", "/auth/register", { body: { name: "Smoke Test", email, password } });
  check(r.status === 201 && Boolean(r.json?.token), "signup works and returns a token", r);
  const token = r.json?.token;
  if (!token) {
    console.error("\nCannot continue without a token.");
    process.exit(1);
  }

  /* ---------------------------------------------------------- */
  section("2. Login guard");

  r = await call("GET", "/transactions");
  check(r.status === 401, "list without a token -> 401", r.status);

  r = await call("GET", "/transactions", { token });
  check(r.status === 200 && r.json?.total === 0, "list with a token -> 200 and empty", r.json);

  r = await call("GET", "/nope-this-route-does-not-exist");
  check(r.status === 404, "unknown route -> 404 JSON", r.status);

  /* ---------------------------------------------------------- */
  section("3. Phone-app device key");

  r = await call("GET", "/auth/device-key", { token });
  check(r.status === 200 && r.json?.hasKey === false, "no device key yet", r.json);

  r = await call("POST", "/auth/device-key", { token });
  const deviceKey = r.json?.deviceKey;
  check(r.status === 201 && /^fina_[a-f0-9]{64}$/.test(deviceKey || ""), "device key created (shown once)", r.json);

  r = await call("GET", "/auth/device-key", { token });
  const leaked = JSON.stringify(r.json || {}).includes(deviceKey || "@@none@@") || "deviceKeyHash" in (r.json || {});
  check(
    r.status === 200 && r.json?.hasKey === true && r.json?.prefix === (deviceKey || "").slice(0, 11) && !leaked,
    "status shows the prefix only, never the key or its hash",
    r.json
  );

  /* ---------------------------------------------------------- */
  section("4. Ingest guards and the cheap pre-filter");

  const otp = { message: "123456 is your OTP for txn of Rs 500 at Amazon. Do not share." };

  r = await call("POST", "/transactions/ingest", { body: otp });
  check(r.status === 401, "ingest with no credentials -> 401", r.status);

  r = await call("POST", "/transactions/ingest", { deviceKey: `fina_${"0".repeat(64)}`, body: otp });
  check(r.status === 401, "ingest with a wrong device key -> 401", r.status);

  r = await call("POST", "/transactions/ingest", { deviceKey, body: {} });
  check(r.status === 400, "ingest with no message -> 400", r.status);

  r = await call("POST", "/transactions/ingest", { deviceKey, body: otp });
  check(r.status === 200 && r.json?.ignored === true, "OTP text is ignored before the queue (no AI call)", r);

  r = await call("POST", "/transactions/ingest", { deviceKey, body: { message: "Hey, are we meeting at 5 today?" } });
  check(r.status === 200 && r.json?.ignored === true, "plain chat text is ignored", r);

  /* ---------------------------------------------------------- */
  section("5. Full pipeline: phone -> queue -> Gemini -> MongoDB -> live push");

  const events = [];
  let socket = null;
  if (ioClient) {
    socket = ioClient(BASE, { auth: { token }, transports: ["websocket"], reconnection: false });
    await new Promise((resolve) => {
      socket.once("connect", resolve);
      socket.once("connect_error", (err) => {
        fail("dashboard socket connects with the login token", err.message);
        resolve();
      });
    });
    if (socket.connected) pass("dashboard socket connects with the login token");
    for (const name of ["transaction:new", "transaction:updated", "transaction:deleted"]) {
      socket.on(name, (payload) => events.push({ name, payload }));
    }
  } else {
    console.log("  (live-push checks skipped: run `npm i -D socket.io-client` here to enable them)");
  }

  const ref = String(Math.floor(1e11 + Math.random() * 9e11)); // 12-digit UPI-style ref
  const sentAt = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
  const bodyA = {
    message: `Rs.180.00 debited from A/c XX1234 to VPA swiggy@icici. UPI Ref ${ref}. -HDFC Bank`,
    timestamp: sentAt,
    source: "notification",
    sourceApp: "com.google.android.apps.messaging",
  };

  r = await call("POST", "/transactions/ingest", { deviceKey, body: bodyA });
  check(r.status === 202 && Boolean(r.json?.jobId), "bank SMS is accepted and queued (202)", r);
  const jobId = r.json?.jobId;

  r = await call("POST", "/transactions/ingest", { deviceKey, body: bodyA });
  check(r.status === 202 && r.json?.jobId === jobId, "the identical alert sent twice maps to the same job (retry-safe)", r.json);

  console.log("\n  waiting for the worker and Gemini (up to 60s)...");
  const tx1 = await waitFor(async () => (await listAll(token)).find((t) => t.refNumber === ref));
  check(
    Boolean(tx1),
    "worker parsed it and saved a transaction",
    "Nothing saved. Look at the server terminal for worker errors (Gemini key or quota, Redis)."
  );

  let flaggedFuzzy = null;
  if (tx1) {
    check(tx1.amount === 180 && tx1.type === "debit", "amount 180, type debit", { amount: tx1.amount, type: tx1.type });
    check(/swiggy/i.test(tx1.merchant), "merchant recognised as Swiggy", tx1.merchant);
    check(
      tx1.source === "notification" && tx1.sourceApp === bodyA.sourceApp,
      "source and sourceApp are stored",
      { source: tx1.source, sourceApp: tx1.sourceApp }
    );
    check(
      typeof tx1.confidenceScore === "number" && tx1.confidenceScore >= 0 && tx1.confidenceScore <= 1,
      "confidenceScore is stored",
      tx1.confidenceScore
    );
    check(
      Math.abs(new Date(tx1.createdAt).getTime() - sentAt) < 1000,
      "createdAt keeps the notification time (not 'now')",
      { createdAt: tx1.createdAt, expected: new Date(sentAt).toISOString() }
    );
    console.log(`        AI said: merchant=${tx1.merchant}, category=${tx1.category}, bank=${tx1.bank}, confidence=${tx1.confidenceScore}`);

    if (socket) {
      check(
        events.some((e) => e.name === "transaction:new" && String(e.payload?._id) === String(tx1._id)),
        "dashboard socket received transaction:new for it",
        events.map((e) => e.name)
      );
    }

    /* ------------------------------------------------------ */
    section("6. Duplicates");

    // Same payment, other app, same UPI reference
    r = await call("POST", "/transactions/ingest", {
      deviceKey,
      body: {
        message: `Paid ₹180 to Swiggy. UPI Ref ${ref}`,
        timestamp: sentAt + 5_000,
        source: "notification",
        sourceApp: "com.phonepe.app",
      },
    });
    check(r.status === 202, "same payment from a second app is accepted by the API", r);

    // A different payment as a marker: once it is saved the queue has passed the duplicate
    const markerRef = String(Math.floor(1e11 + Math.random() * 9e11));
    r = await call("POST", "/transactions/ingest", {
      deviceKey,
      body: {
        message: `Rs.77.00 debited from A/c XX1234 at Chai Point. UPI Ref ${markerRef}. -HDFC Bank`,
        timestamp: Date.now() - 60 * 60 * 1000,
        source: "notification",
        sourceApp: "com.google.android.apps.messaging",
      },
    });
    check(r.status === 202, "second payment (Rs 77) queued", r);

    const marker = await waitFor(async () => (await listAll(token)).find((t) => t.refNumber === markerRef));
    check(Boolean(marker), "Rs 77 payment saved", "Not saved in 60s. Check the server terminal.");
    await sleep(6_000);

    const all180 = (await listAll(token)).filter((t) => t.amount === 180);
    if (all180.length === 1) {
      pass("duplicate skipped by UPI reference: still exactly one Rs 180 transaction");
    } else if (all180.length === 2 && all180.some((t) => t.possibleDuplicate)) {
      pass("duplicate kept but flagged (the AI did not extract the reference, so the fallback caught it)");
    } else {
      fail("the same payment was double counted", all180.map((t) => ({ id: t._id, flagged: t.possibleDuplicate })));
    }

    // Same amount, different apps, no reference -> flagged, not dropped
    const t0 = Date.now() - 30 * 60 * 1000;
    await call("POST", "/transactions/ingest", {
      deviceKey,
      body: {
        message: "Rs.333.00 debited from A/c XX4321 at Zomato. Avl Bal Rs.9,999.00 -HDFC Bank",
        timestamp: t0,
        source: "notification",
        sourceApp: "com.google.android.apps.messaging",
      },
    });
    await call("POST", "/transactions/ingest", {
      deviceKey,
      body: {
        message: "Paid ₹333 to Zomato",
        timestamp: t0 + 20_000,
        source: "notification",
        sourceApp: "com.phonepe.app",
      },
    });

    const pair = await waitFor(async () => {
      const found = (await listAll(token)).filter((t) => t.amount === 333);
      return found.length >= 2 ? found : null;
    });
    if (pair) {
      const flagged = pair.filter((t) => t.possibleDuplicate);
      const original = pair.find((t) => !t.possibleDuplicate);
      check(flagged.length === 1, "same amount from two apps, no reference: exactly one is flagged", pair.map((t) => t.possibleDuplicate));
      if (flagged.length === 1 && original) {
        check(String(flagged[0].duplicateOf) === String(original._id), "the flagged one points at the original (duplicateOf)", flagged[0].duplicateOf);
      }
      flaggedFuzzy = flagged[0] || null;
    } else {
      fail("both Rs 333 messages saved", "Fewer than two saved in 60s. Check the server terminal.");
    }

    /* ------------------------------------------------------ */
    section("7. Totals, review and edits");

    let totals = await debitTotal(token);
    check(Math.abs(totals.total - 590) < 0.01, "totals skip flagged duplicates (180 + 77 + 333 = 590)", totals);
    check(typeof totals.reviewCount === "number" && totals.reviewCount >= 1, "reviewCount is returned for the dashboard badge", totals.reviewCount);

    if (flaggedFuzzy) {
      r = await call("POST", `/transactions/${flaggedFuzzy._id}/confirm`, { token });
      check(r.status === 200 && r.json?.transaction?.possibleDuplicate === false, "Confirm clears the duplicate flag", r.json);
      totals = await debitTotal(token);
      check(Math.abs(totals.total - 923) < 0.01, "after confirming, it counts in the totals (590 + 333 = 923)", totals);
    }

    const newDate = "2026-01-15T10:30:00.000Z";
    r = await call("PUT", `/transactions/${tx1._id}`, { token, body: { category: "Food & Dining", date: newDate } });
    check(r.status === 200 && r.json?.transaction?.category === "Food & Dining", "edit category -> 200", r.json);
    check(
      r.json?.transaction?.createdAt && new Date(r.json.transaction.createdAt).toISOString() === newDate,
      "an edited date is kept",
      r.json?.transaction?.createdAt
    );
    check(r.json?.transaction?.confidenceScore === 1, "an edited transaction is no longer 'low confidence'", r.json?.transaction?.confidenceScore);

    r = await call("PUT", `/transactions/${tx1._id}`, { token, body: { category: "Foood" } });
    check(r.status === 400, "invalid category -> 400", r.status);
    r = await call("PUT", `/transactions/${tx1._id}`, { token, body: { amount: -5 } });
    check(r.status === 400, "negative amount -> 400", r.status);

    r = await call("GET", "/transactions?category=Food%20%26%20Dining", { token });
    check(r.status === 200 && r.json?.transactions?.some((t) => t._id === tx1._id), "filter by category works", r.json?.total);
    r = await call("GET", "/transactions?category=Nope", { token });
    check(r.status === 400, "unknown category filter -> 400", r.status);
    r = await call("GET", "/transactions?review=true", { token });
    check(r.status === 200 && !r.json?.transactions?.some((t) => t._id === tx1._id), "reviewed items leave the 'needs review' list", r.json?.total);
    r = await call("GET", "/transactions?search=zomato", { token });
    check(r.status === 200 && (r.json?.total ?? 0) >= 1, "search by merchant works", r.json?.total);
    r = await call("GET", "/transactions?limit=100000", { token });
    check(r.status === 200 && (r.json?.count ?? 0) <= 100, "page size is capped", r.json?.count);

    if (marker) {
      r = await call("DELETE", `/transactions/${marker._id}`, { token });
      check(r.status === 200, "delete -> 200", r.json);
      check(!(await listAll(token)).some((t) => t._id === marker._id), "deleted transaction is gone");
    }

    if (socket) {
      await sleep(500);
      check(events.some((e) => e.name === "transaction:updated"), "dashboard socket received transaction:updated", events.map((e) => e.name));
      check(events.some((e) => e.name === "transaction:deleted"), "dashboard socket received transaction:deleted", events.map((e) => e.name));
    }
  }

  /* ---------------------------------------------------------- */
  section("8. Revoking the device key");

  r = await call("DELETE", "/auth/device-key", { token });
  check(r.status === 200, "revoke -> 200", r.json);
  r = await call("POST", "/transactions/ingest", { deviceKey, body: { message: "Rs.1.00 debited from A/c XX1234 UPI Ref 999999999999" } });
  check(r.status === 401, "the revoked key stops working immediately", r.status);

  if (socket) socket.close();

  console.log(`\n${passes} passed, ${failures} failed.`);
  console.log(`Test data: user ${email} (delete it in Atlas if you like; its transactions are tied to that user).`);
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  console.error("\nTest script crashed:", err);
  process.exit(1);
});