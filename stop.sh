#!/bin/bash

# Flipper TUX Stop Script
# This script safely stops the running Node.js server.

echo "--- 🛑 Stopping Flipper TUX Server ---"

# Find and kill the Node.js process running server.js
# pkill is used to kill a process by its name or attributes.
# The "-f" flag matches against the full command line, not just the process name.
pkill -f "node server.js"

# Check the exit status of the pkill command
if [ $? -eq 0 ]; then
    echo "✅ Server stopped successfully."
else
    echo "ℹ️ Server was not found running."
fi
