const Redis = require("ioredis");
require("dotenv").config();

const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false }
});

redis.ping().then((res) => {
  console.log("PING Result:", res); // Should print "PONG"
  process.exit(0);
}).catch((err) => {
  console.error("Connection failed:", err);
  process.exit(1);
});