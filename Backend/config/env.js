const { cleanEnv, str, port, makeValidator } = require("envalid");

const strongSecret = makeValidator((value) => {
  if (typeof value !== "string" || value.length < 32) {
    throw new Error("must be at least 32 characters");
  }
  return value;
});

module.exports = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: port({ default: 5000 }), // matches VITE_API_URL=http://localhost:5000
  MONGODB_URI: str(),
  REDIS_URL: str(),
  JWT_SECRET: strongSecret(),
  GEMINI_API_KEY: str(),
  CLIENT_URL: str({ default: "http://localhost:5173" }),
});