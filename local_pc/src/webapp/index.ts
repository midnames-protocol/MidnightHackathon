import { io } from "socket.io-client";
import { RequestData } from "../server/models/RequestData";
import './styles.css';

// Create socket connection
const socket = io();

// DOM elements
const connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
const dataList = document.getElementById('data-list') as HTMLDivElement;

// Connection events
socket.on('connect', () => {
  connectionStatus.textContent = 'Connected';
  connectionStatus.classList.remove('offline');
  connectionStatus.classList.add('online');
  
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  connectionStatus.textContent = 'Disconnected';
  connectionStatus.classList.remove('online');
  connectionStatus.classList.add('offline');
  
  console.log('Disconnected from server');
});

// Handle incoming data
socket.on('new-data', (data: RequestData) => {
  console.log('Received new data:', data);
  
  // Clear empty state if it exists
  const emptyState = dataList.querySelector('.empty-state');
  if (emptyState) {
    dataList.removeChild(emptyState);
  }
  
  // Create data item element
  const dataItem = document.createElement('div');
  dataItem.className = 'data-item';
  
  // Create timestamp
  const timestamp = new Date(data.timestamp).toLocaleString();
  
  // Create data item content
  dataItem.innerHTML = `
    <strong>ID:</strong> ${data.id}<br>
    <strong>Time:</strong> ${timestamp}<br>
    <strong>Source:</strong> ${data.source.device} (${data.source.ip})<br>
    <strong>Type:</strong> ${data.content.type}
    <pre>${JSON.stringify(data.content.payload, null, 2)}</pre>
  `;
  
  // Add to list (newest first)
  dataList.insertBefore(dataItem, dataList.firstChild);
});

// Fetch previously received data on load
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    const data: RequestData[] = await response.json();
    
    if (data.length > 0) {
      // Clear empty state
      dataList.innerHTML = '';
      
      // Add each data item
      data.forEach(item => {
        socket.emit('new-data', item);
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);
