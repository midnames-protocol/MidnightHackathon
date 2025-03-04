# Midnight Passport Verification System

## Overview
Welcome to the Midnight Passport Verification System! Our project is a secure, privacy-focused solution that uses Midnight blockchain's zero-knowledge proofs to verify passport information. It lets you confirm details like age and nationality without exposing personal data.

This project includes three main components:

- **Blockchain DApp**: The secure engine that verifies passport data.
- **Android Mobile App**: Reads passport information via NFC.
- **Local Server**: Connects the mobile app with the blockchain DApp.

## Complete System Architecture
Our system brings together several components that work together to provide a safe and clear verification process.

### 1. Mobile App (Android)
- **Native Android App**: Scans physical passports using NFC.
- **Data Extraction**: Reads encrypted data according to ICAO standards.
- **Secure Transmission**: Sends your passport data to the local server.
- **User-Friendly Interface**: Provides a clear, guided scanning experience.

### 2. Local Server (Express.js)
- **Real-Time Communication**: Uses HTTPS and Socket.IO for prompt data exchange.
- **Data Bridge**: Connects the mobile app with the blockchain DApp.
- **Data Processing**: Formats and prepares passport data for verification.
- **Network Detection**: Automatically detects local network IPs to help you connect your devices.

### 3. Frontend UI (React)
- **Simple Interface**: Built with React and Material UI.
- **Privacy-Focused Display**: Shows only the verification results, keeping sensitive data private.

### 4. API Integration Layer
- **BBoardAPI**: Manages communication between the UI and the blockchain.
- **Smart Contract Management**: Oversees deployment, discovery, and circuit execution.
- **Real-Time Updates**: Uses RxJS Observables to keep information current.

### 5. Blockchain Layer
- **Smart Contracts**: Developed in the Compact language.
- **Zero-Knowledge Proofs**: Verify details like age and nationality without exposing personal information.
- **On-Chain Storage**: Records only the verification result, not your actual passport data.

## End-to-End Verification Flow

### Passport Scanning
1. **Launch the App**: Open the Android app and enter your passport details (document number, birth date, expiry date).
2. **Scan**: The app reads the passport via NFC and extracts encrypted data.
3. **Data Transfer**: Your information is sent to the local server.

### Data Processing
1. **Data Handling**: The local server receives your data and forwards it to the DApp.
2. **Preparation**: The DApp formats the data for blockchain verification.

### Blockchain Verification
1. **Deploy Contract**: Your passport data is used to deploy a verification contract.
2. **Verification**: Zero-knowledge proofs check your age and nationality without exposing your details.
3. **On-Chain Storage**: The verification result is recorded on the blockchain.

### Result Display
1. **View Results**: Check the verification outcome in the DApp UI.
2. **Confirmation**: Receive confirmation that your passport has been verified.
3. **Shareable Proof**: The contract address can be shared as proof of verification if needed.

## Setup Instructions
Follow these steps to get started with each component:

### Android App Setup
1. **Enable Developer Mode** on your Android:
   - Go to Settings > About Phone and tap Build Number 7 times.
   - Go to Settings > Developer Options and enable USB Debugging.
2. **Connect Your Device**: Plug your phone into your computer via USB.
3. **Open the Project** in Android Studio.
4. **Build & Run**: Build and run the app on an NFC-capable Android device.
   - Alternatively, compile the APK and install it manually.
5. **Enable NFC**: Make sure NFC is turned on in your device settings.
6. **Network Requirement**: Connect your phone to the same local network as the server.

### Local Server Setup
1. Navigate to the local_pc directory.
2. **Generate SSL Certificates**:
   ```bash
   sh ./scripts/ssl.sh
   ```
3. **Install Dependencies**:
   ```bash
   npm i
   ```
4. **Start the Server**:
   ```bash
   npm run dev
   ```
5. Note the IP Addresses displayed for connecting your mobile device.
6. **Important**: Open your browser to the server address (https://localhost:3000 or the displayed IP with port) and accept the self-signed certificate when prompted. This is necessary for the connection to work properly.

### DApp Setup

#### Prerequisites
1. **Run the Proof Server** via Docker:
   ```bash
   docker pull midnightnetwork/proof-server:latest
   docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'
   ```

2. **Install the Compact Compiler**:
   - Download from [Midnight Releases](https://releases.midnight.network/).
   - Works on Linux or Windows (with WSL).
   - Make the compiler files executable:
     ```bash
     chmod +x compactc.bin zkir compactc
     ```
   - Verify the installation:
     ```bash
     ./compactc --version
     ```
   - Set the COMPACT_HOME environment variable:
     ```bash
     export COMPACT_HOME='<absolute path to compactc directory>'  IMPORTANT
     ```

3. **Install Lace Wallet**:
   - Download from [Midnight Releases](https://releases.midnight.network/).
   - Choose the correct version (for example, midnight-lace-x.y.z), unzip it, and load it in your browser:
     - Go to Settings > Extensions in your browser.
     - Enable Developer Mode.
     - Click Load Unpacked and select the unzipped folder.

4. **Get Test Tokens**:
   - Visit the [Testnet Faucet](https://faucet.testnet-02.midnight.network/).

5. **Check Compatibility**:
   - See the [Compatibility Matrix](https://docs.midnight.network/relnotes/comp-matrix).

#### Configure Development Environment
1. **Setup NVM**:
   ```bash
   nvm install
   ```

2. **Enable Yarn**:
   ```bash
   corepack enable
   yarn --version
   ```

3. **Install Dependencies**:
   ```bash
   yarn
   ```

4. **Set the Compact Compiler Path** (if not already set):
   ```bash
   export COMPACT_HOME='<absolute path to compactc directory>'
   ```

5. **Build the Project**:
   ```bash
   npx turbo build  # add --force if needed
   ```

6. **Start the DApp**:
   ```bash
   cd [dapp-directory]
   yarn start
   ```

### Connecting the Components
1. **Launch the Local Server** and note the IP address.
2. **Enter the IP Address** in the Android app's server field.
3. **Scan Your Passport** using the Android app.
4. **View Your Results** in the DApp UI.

## Technical Features

### Android App
- **Passport Reading**: Uses the JMRTD library to scan passports.
- **NFC Communication**: Reads data from NFC tags.
- **Certificate Handling**: Manages self-signed certificates for a secure connection.
- **User Interface**: Guides you through the scanning process.

### Local Server
- **HTTPS Connection**: Uses self-signed certificates for secure communication.
- **Real-Time Data Transfer**: Powered by Socket.IO.
- **CORS Support**: Manages cross-origin resource sharing.
- **Network Detection**: Helps you connect devices by detecting local IPs.

### Blockchain DApp
- **Zero-Knowledge Circuits**: Verify passport details while keeping your data private.
- **Real-Time UI Updates**: Uses observable state management for current information.
- **Smart Contract Interface**: Manages the verification process.
- **Wallet Integration**: Handles verification transactions safely.

## Development Notes
- **Testing Tip**: Use an NFC-capable device when testing the Android app.
- **Certificate Reminder**: Accept self-signed certificates on your device when prompted.
- **Connection Help**: The local server shows available network interfaces to assist with connections.
- **Privacy Focus**: Only the verification result is stored on-chain; your passport data remains private.

## Additional Resources
- **Learn more about us**: [midnames.com](https://midnames.com/)
- **Midnight Network**: [midnight.network](https://midnight.network/)
- **Documentation**: [docs.midnight.network](https://docs.midnight.network/)
- **Blog**: [midnight.network/blog](https://midnight.network/blog)
- **Unshielded**: [midnight.network/unshielded](https://midnight.network/unshielded)
