# AI Audio Call Translation

This project allows users to initiate and receive real-time audio calls using WebRTC, with Firebase Firestore for signaling and handling ICE candidates. The app also supports local testing on multiple devices using ngrok for connecting over the internet.

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js and npm installed on your machine.
- ngrok installed for testing audio calls across different devices (either via terminal or directly from [ngrok's website](https://ngrok.com/download)).
- Firebase Firestore is already configured in the project. You do not need to set up your own Firebase environment unless you want to test with your own Firebase project.

### 1. Pull the Latest Changes

Before doing anything, ensure you have the latest code from the repository:

```bash
git pull origin main
```

### 2. Install Node.js Dependencies


After pulling the latest code, install the required Node.js packages:

```bash
npm install
```
### 3. Firebase Setup

A Firebase environment is already configured in this project, and you will not need to set it up unless you want to test the app with your own Firebase project. To do so, simply replace the Firebase configuration in the firebase.js file.

### 4. Testing with ngrok

To test audio calls across different devices, use ngrok to expose your local server:

```bash
ngrok http 3000
```
This will provide a public URL that you can use to connect two devices. If ngrok isn't installing through the terminal, you can download and install it from ngrok's website.

### Troubleshooting
- If you encounter any issues with ngrok installation, try downloading it directly from the website.
- Make sure your Firebase Firestore rules allow for read/write access if you're using your own Firebase environment for testing.
- If audio calls aren't working, ensure that microphone permissions are granted for both devices.