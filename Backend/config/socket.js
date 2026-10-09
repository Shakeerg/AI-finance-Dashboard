// backend/config/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

// corsOrigin is the same origin-check function Express uses
const initSocket = (httpServer, corsOrigin) => {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  });

  // Every connection must present a valid JWT: io(url, { auth: { token } })
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
      socket.userId = String(decoded.id);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  // One private room per user, so people only receive their own data
  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
};

// Also closes the underlying HTTP server
const closeSocket = () =>
  new Promise((resolve) => (io ? io.close(() => resolve()) : resolve()));

module.exports = { initSocket, emitToUser, closeSocket };