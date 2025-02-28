import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { router, initSocketIO } from "./routes/api";
import os from "os";

const app = express();

// SSL certificate options
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "../../ssl/server.key")),
  cert: fs.readFileSync(path.join(__dirname, "../../ssl/server.crt")),
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Initialize Socket.IO with HTTPS server
const io = new SocketServer(server, {
  cors: {
    origin: "https://localhost:8080", // Updated to HTTPS
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket.io
initSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", router);

// Serve static webapp files in production
app.use(express.static("dist/webapp"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Handle client ready event
  socket.on("client-ready", (data) => {
    console.log("Client ready:", data);
    // Send a welcome message to confirm the connection is working
    socket.emit("server-ready", { message: "Server connection established!" });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);

  // Get the public local IP addresses
  const networkInterfaces = os.networkInterfaces();
  const publicIps: string[] = [];

  // Loop through network interfaces to find IPv4 addresses that aren't internal
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      interfaces.forEach((iface) => {
        // Only include IPv4 addresses that aren't internal (127.0.0.1, etc.)
        if (iface.family === "IPv4" && !iface.internal) {
          publicIps.push(iface.address);
        }
      });
    }
  });

  if (publicIps.length > 0) {
    console.log("\nAccess from other devices on your network:");
    publicIps.forEach((ip) => {
      console.log(`Server: https://${ip}:${PORT}`);
    });
  }

  console.log(
    "\nNote: You may need to accept the self-signed certificate in your browser"
  );
});
