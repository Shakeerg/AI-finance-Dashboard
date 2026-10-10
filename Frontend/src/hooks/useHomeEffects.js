import { useLayoutEffect } from "react";

const fmt = (n, d) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Scroll / pointer animations for the landing page.
 * Everything degrades gracefully: no IntersectionObserver or "reduce motion"
 * -> content is shown immediately with no movement.
 */
export default function useHomeEffects(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hasIO = "IntersectionObserver" in window;
    const cleanups = [];
    const on = (target, evt, fn, opts) => {
      target.addEventListener(evt, fn, opts);
      cleanups.push(() => target.removeEventListener(evt, fn, opts));
    };

    /* ---------- count-up numbers ---------- */
    const countEls = [...root.querySelectorAll("[data-count]")];
    const setCount = (el, v) => {
      const d = Number(el.dataset.decimals || 0);
      el.textContent = `${el.dataset.prefix || ""}${fmt(v, d)}${el.dataset.suffix || ""}`;
    };
    const runCount = (el) => {
      if (el._done) return;
      el._done = true;
      const to = parseFloat(el.dataset.count);
      if (reduce) return setCount(el, to);
      const t0 = performance.now();
      const dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        setCount(el, to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    /* ---------- reveal on scroll ---------- */
    const revealEls = [...root.querySelectorAll("[data-reveal]")];
    if (!hasIO || reduce) {
      revealEls.forEach((el) => el.classList.add("in"));
      countEls.forEach((el) => {
        el._done = true;
        setCount(el, parseFloat(el.dataset.count));
      });
    } else {
      root.classList.add("fx-ready");
      countEls.forEach((el) => setCount(el, 0));
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            const el = en.target;
            el.classList.add("in");
            if (el.hasAttribute("data-count")) runCount(el);
            el.querySelectorAll("[data-count]").forEach(runCount);
            io.unobserve(el);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
      countEls.forEach((el) => {
        if (!el.closest("[data-reveal]")) io.observe(el);
      });
      cleanups.push(() => io.disconnect());
    }

    /* ---------- scroll: progress bar, navbar hide/show, hero parallax ---------- */
    const bar = root.querySelector(".scroll-progress");
    const nav = root.querySelector(".navbar");
    const hero = root.querySelector(".hero");
    const par = [...root.querySelectorAll("[data-parallax]")];
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
        if (nav) {
          nav.classList.toggle("scrolled", y > 40);
          if (y > 520 && y > lastY + 4) nav.classList.add("hide");
          else if (y < lastY - 4 || y <= 520) nav.classList.remove("hide");
        }
        if (hero && !reduce && y < window.innerHeight * 1.6) hero.style.setProperty("--sy", String(Math.round(y)));
        if (!reduce) {
          par.forEach((el) => {
            const r = el.parentElement.getBoundingClientRect();
            if (r.bottom < -300 || r.top > window.innerHeight + 300) return;
            const c = r.top + r.height / 2 - window.innerHeight / 2;
            el.style.transform = `translate3d(0, ${(-c * Number(el.dataset.parallax)).toFixed(1)}px, 0)`;
          });
        }
        lastY = y;
      });
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- pointer: cursor glow, magnetic buttons, tilt panels ---------- */
    if (fine && !reduce) {
      const glow = root.querySelector(".cursor-glow");
      const magnets = [...root.querySelectorAll(".primary-btn, .secondary-btn, .nav-cta")];
      let ev = null;
      let pending = false;
      const frame = () => {
        pending = false;
        if (!ev) return;
        if (glow) {
          glow.style.transform = `translate3d(${ev.clientX}px, ${ev.clientY}px, 0)`;
          root.classList.add("has-pointer");
        }
        magnets.forEach((el) => {
          const r = el.getBoundingClientRect();
          const dx = ev.clientX - (r.left + r.width / 2);
          const dy = ev.clientY - (r.top + r.height / 2);
          const reach = Math.max(r.width, r.height) * 0.85;
          el.style.translate = Math.hypot(dx, dy) < reach ? `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px` : "";
        });
      };
      on(window, "mousemove", (e) => {
        ev = e;
        if (!pending) {
          pending = true;
          requestAnimationFrame(frame);
        }
      }, { passive: true });
      on(document, "mouseleave", () => root.classList.remove("has-pointer"));

      root.querySelectorAll("[data-tilt]").forEach((el) => {
        const move = (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          el.style.setProperty("--try", `${((x - 0.5) * 7).toFixed(2)}deg`);
          el.style.setProperty("--trx", `${((0.5 - y) * 7).toFixed(2)}deg`);
          el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
          el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        };
        const leave = () => {
          el.style.setProperty("--try", "0deg");
          el.style.setProperty("--trx", "0deg");
        };
        on(el, "mousemove", move);
        on(el, "mouseleave", leave);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [rootRef]);
}