import { io } from "socket.io-client";
import { RequestData } from "../server/models/RequestData";
import "./styles.css";

// Connect to the Socket.IO server through webpack proxy
// No need to specify the URL - it will use the current host
const socket = io({
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

// DOM elements
const connectionStatus = document.getElementById(
  "connection-status"
) as HTMLDivElement;
const dataList = document.getElementById("data-list") as HTMLDivElement;

// Connection events
socket.on("connect", () => {
  connectionStatus.textContent = "Connected";
  connectionStatus.classList.remove("offline");
  connectionStatus.classList.add("online");

  console.log("Connected to server with ID:", socket.id);

  // Test by emitting a message to the server
  socket.emit("client-ready", { clientId: socket.id });
});

socket.on("disconnect", () => {
  connectionStatus.textContent = "Disconnected";
  connectionStatus.classList.remove("online");
  connectionStatus.classList.add("offline");

  console.log("Disconnected from server");
});

// Handle connection errors
socket.on("connect_error", (err) => {
  console.log("Connection error:", err.message);
  connectionStatus.textContent = "Connection Error";
  connectionStatus.classList.remove("online");
  connectionStatus.classList.add("offline");
});

// Handle incoming data
socket.on("new-data", (data: RequestData) => {
  console.log("Received new data:", data);

  // Clear empty state if it exists
  const emptyState = dataList.querySelector(".empty-state");
  if (emptyState) {
    dataList.removeChild(emptyState);
  }

  // Create data item element using our helper function
  const dataItem = createDataItemElement(data);

  // Add to list (newest first)
  dataList.insertBefore(dataItem, dataList.firstChild);
});

// Fetch previously received data on load
const fetchData = async () => {
  try {
    console.log("Fetching data from /api/data");
    const response = await fetch("/api/data");

    if (!response.ok) {
      throw new Error(`API returned ${response.status} ${response.statusText}`);
    }

    const data: RequestData[] = await response.json();
    console.log("Received data:", data);

    if (data && data.length > 0) {
      // Clear empty state
      dataList.innerHTML = "";

      // Add each data item
      data.forEach((item) => {
        // Create a new data item element directly instead of re-emitting
        const dataItem = createDataItemElement(item);
        dataList.insertBefore(dataItem, dataList.firstChild);
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Helper function to create data item elements
const createDataItemElement = (data: RequestData) => {
  const dataItem = document.createElement("div");
  dataItem.className = "data-item";

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

  return dataItem;
};

// Initialize
document.addEventListener("DOMContentLoaded", fetchData);
