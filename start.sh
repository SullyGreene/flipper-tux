#!/bin/bash

# Flipper TUX Startup Script

echo "--- Starting Flipper TUX ---"

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js not found. Please install it in Termux first:"
    echo "   pkg install nodejs-lts"
    exit 1
fi

# Check if Termux:API is accessible
if ! command -v termux-battery-status &> /dev/null
then
    echo "⚠️ Warning: Termux API commands not found."
    echo "   Please ensure the Termux:API app is installed and you have run 'pkg install termux-api'."
fi


# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies. Please check your connection and try again."
    exit 1
fi

# Start the server
echo "🚀 Starting the Node.js server..."
echo "   You can stop the server by pressing Ctrl+C."
node server.js

echo "--- Flipper TUX has stopped ---"
