#!/bin/bash

# Flipper TUX Uninstall Script
# This script will completely remove the Flipper TUX project and its files.

echo "--- 🗑️ Flipper TUX Uninstaller ---"
echo ""
echo "⚠️ WARNING: This will permanently delete the entire flipper-tux project directory."
echo "This action cannot be undone."
echo ""

# Confirmation prompt
read -p "Are you sure you want to continue? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Uninstall cancelled."
    exit 0
fi

echo ""
echo "Proceeding with uninstallation..."

# 1. Stop the server if it's running
echo "Step 1: Attempting to stop the server..."
# Assuming we are inside the flipper-tux directory when running this
if [ -f "stop.sh" ]; then
    bash stop.sh
else
    # Fallback if run from outside the directory
    pkill -f "node server.js"
fi
echo "✅ Server stop command issued."
echo ""

# 2. Go up one directory and remove the project folder
echo "Step 2: Removing project directory..."
# Get the current directory name
current_dir_name=${PWD##*/}

if [ "$current_dir_name" == "flipper-tux" ]; then
    cd ..
    rm -rf flipper-tux
    echo "✅ Project directory 'flipper-tux' has been deleted."
else
    echo "❌ Error: Please run this script from within the 'flipper-tux' directory."
    exit 1
fi
echo ""

echo "🎉 Uninstallation complete."
