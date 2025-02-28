import express from 'express';
import { RequestData } from '../models/RequestData';
import { Server as SocketServer } from 'socket.io';

export const router = express.Router();
export let io: SocketServer;

export const initSocketIO = (socketIO: SocketServer) => {
  io = socketIO;
};

router.post('/data', (req, res) => {
  try {
    const requestData: RequestData = req.body;
    
    // Validate the request data
    if (!requestData.id || !requestData.content || !requestData.source) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    console.log('Received request:', requestData);
    
    // Add timestamp if not present
    if (!requestData.timestamp) {
      requestData.timestamp = Date.now();
    }
    
    // Forward the validated data to connected webapp clients
    io.emit('new-data', requestData);
    
    res.status(200).json({ success: true, message: 'Data received and processed' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all previously received data (in a real app, you'd use a database)
const receivedData: RequestData[] = [];

router.get('/data', (req, res) => {
  res.json(receivedData);
});
