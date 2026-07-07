const { cleanEnv, str } = require("envalid");

module.exports = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  MONGODB_URI: str(),
  JWT_SECRET: str(),
  GEMINI_API_KEY: str(),
  CLIENT_URL: str({ default: "http://localhost:5173" }),
});