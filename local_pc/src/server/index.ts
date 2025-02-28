import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { router, initSocketIO } from './routes/api';

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize socket.io
initSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Serve static webapp files in production
app.use(express.static('dist/webapp'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
