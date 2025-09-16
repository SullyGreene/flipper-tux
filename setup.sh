#!/bin/bash

# Flipper TUX Setup Script
# This script automates the initial setup for new users.

echo "--- 🚀 Starting Flipper TUX Setup ---"

# 1. Update Termux packages
echo "Step 1: Updating Termux packages..."
pkg update -y && pkg upgrade -y
echo "✅ Termux packages are up to date."
echo ""

# 2. Install required dependencies
echo "Step 2: Installing core dependencies (git, nodejs, termux-api)..."
pkg install git nodejs-lts termux-api -y
echo "✅ Core dependencies installed."
echo ""

# 3. Clone the repository if it doesn't exist
if [ ! -d "flipper-tux" ]; then
    echo "Step 3: Cloning the Flipper TUX repository..."
    git clone https://github.com/SullyGreene/flipper-tux.git
    if [ $? -ne 0 ]; then
        echo "❌ Error: 'git clone' failed. Please check your internet connection."
        exit 1
    fi
    cd flipper-tux
else
    echo "Step 3: Found existing flipper-tux directory. Skipping clone."
    cd flipper-tux
fi
echo "✅ Repository is ready."
echo ""

# 4. Install Node.js dependencies
echo "Step 4: Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error: 'npm install' failed. Please check your internet connection or package.json for errors."
    exit 1
fi
echo "✅ Node.js dependencies installed."
echo ""

echo "🎉 Setup complete! You are now in the project directory."
echo "To start the server, run: bash start.sh"
