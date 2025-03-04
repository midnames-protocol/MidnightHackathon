# Passport Data Loading Feature

This feature allows users to load their passport data from an external app through a local server.

## Installation

Install the required dependencies:

```bash
yarn add socket.io-client @types/socket.io-client
```

After installing the dependencies, rebuild the project using Turbo:

```bash
npx turbo build
```

## How It Works

1. The user clicks the "Load from App" button in the UI
2. The app connects to the local server via WebSocket
3. When the server receives data from a mobile device, it forwards it to the web UI
4. The passport form is automatically filled with the received data

## Testing

### Step 1: Start the local socket.io server (in the local_pc directory)
```bash
cd /home/devstation/MidnightHackathon/local_pc
npm run start
```

### Step 2: Start the web UI (in a separate terminal)
```bash
cd /home/devstation/MidnightHackathon/contracts/midnight-examples-0.2.0/examples/bboard/bboard-ui
yarn start
```

### Step 3: Send test data
You can test the feature using the test script:

```bash
node /home/devstation/MidnightHackathon/local_pc/send-test-data.js
```

## Troubleshooting

If you have connection issues:

1. Make sure both servers are running (socket.io server on port 3000 and web UI on port 8080)
2. Check browser console for connection errors
3. Ensure you're accepting the self-signed certificate by visiting https://localhost:3000 directly first
4. Try restarting both servers if the connection still fails

## Implementation Details

The feature consists of three main parts:

1. **SocketService** - Manages WebSocket connection with the server
2. **RequestData model** - Defines the data format received from the server
3. **PassportDataMapper** - Converts received data to the format needed by the form
4. **PassportDataForm component** - UI with the "Load from App" button and loading states
