#!/bin/bash

# Flipper TUX Update Script
# This script pulls the latest version from the main branch and reinstalls dependencies.

echo "--- 🐧 Updating Flipper TUX ---"

# 1. Pull latest changes from the git repository
echo "Step 1: Pulling latest changes from GitHub..."
git pull origin main

# Check if the pull was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: 'git pull' failed. Please check for local changes, your internet connection, or repository permissions."
    exit 1
fi

echo "✅ Git repository updated successfully."
echo ""

# 2. Install/update Node.js dependencies
echo "Step 2: Installing/updating Node.js dependencies with npm..."
npm install

# Check if npm install was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: 'npm install' failed. Please check your internet connection or package.json for errors."
    exit 1
fi

echo "✅ Dependencies are up to date."
echo ""

echo "🎉 Update complete! You can now restart the server with 'npm start' or 'bash start.sh'."
