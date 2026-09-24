// backend/queues/transactionQueue.js
const { Queue } = require("bullmq");
const { redisOptions } = require("../config/redis");

const QUEUE_NAME = "transaction-ingestion";

const transactionQueue = new Queue(QUEUE_NAME, {
  // Producer connection: fail fast (3 retries) so API requests return 503
  // during a Redis outage instead of hanging forever.
  connection: { ...redisOptions, maxRetriesPerRequest: 3 },
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s, 16s
    removeOnComplete: { age: 24 * 3600, count: 1000 }, // keep a 24h dedup window
    removeOnFail: { age: 7 * 24 * 3600 },              // keep failures for 7 days
  },
});

transactionQueue.on("error", (err) => {
  console.error(`❌ Queue "${QUEUE_NAME}" error:`, err.code || "", err.message);
});

// dedupKey makes the job ID stable, so duplicate submissions are ignored
const addTransaction = (data, dedupKey) =>
  transactionQueue.add("parse-bank-sms", data, { jobId: `txn-${dedupKey}` });

const closeQueue = () => transactionQueue.close();

module.exports = { transactionQueue, addTransaction, closeQueue, QUEUE_NAME };