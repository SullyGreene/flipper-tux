#!/bin/bash
# File: flipper-tux/diagnostics.sh

# Flipper TUX Diagnostics Script
# This script checks if all requirements are met and the environment is set up correctly.

echo "--- 🩺 🐧 Flipper TUX Diagnostics ---"
echo ""

# Function to print success or failure
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "✅ $1: Found"
    else
        echo -e "❌ $1: Not Found"
    fi
}

# --- 1. System Checks ---
echo "--- 1. System Dependencies ---"
command -v su >/dev/null 2>&1
check_status "Root (su)"

command -v node >/dev/null 2>&1
check_status "Node.js"

command -v npm >/dev/null 2>&1
check_status "NPM"

command -v git >/dev/null 2>&1
check_status "Git"

command -v termux-api >/dev/null 2>&1
check_status "Termux:API"
echo ""

# --- 2. Project File Checks ---
echo "--- 2. Project Files ---"
[ -f "server.js" ] && echo "✅ server.js: Found" || echo "❌ server.js: Not Found"
[ -d "node_modules" ] && echo "✅ node_modules/: Found" || echo "❌ node_modules/: Not Found (run setup.sh or npm install)"
[ -d "public" ] && echo "✅ public/: Found" || echo "❌ public/: Not Found"
[ -d "tux" ] && echo "✅ tux/: Found" || echo "❌ tux/: Found"
echo ""

# --- 3. Infrared Hardware Checks (NEW) ---
echo "--- 3. Infrared Hardware (Best Effort) ---"
IR_TRANSMIT_PATH="/sys/class/remote/transmit"
IR_RECEIVE_PATH="/dev/lirc0"

if [ -e "$IR_TRANSMIT_PATH" ]; then
    if [ -w "$IR_TRANSMIT_PATH" ]; then
        echo "✅ IR Transmitter: Found and seems writable at $IR_TRANSMIT_PATH"
    else
        echo "⚠️ IR Transmitter: Found at $IR_TRANSMIT_PATH but it is NOT writable. 'send' command may fail."
    fi
else
    echo "❌ IR Transmitter: Not found at default path ($IR_TRANSMIT_PATH). You may need to edit tux/infrared.js."
fi

if [ -e "$IR_RECEIVE_PATH" ]; then
     if [ -r "$IR_RECEIVE_PATH" ]; then
        echo "✅ IR Receiver: Found and seems readable at $IR_RECEIVE_PATH"
    else
        echo "⚠️ IR Receiver: Found at $IR_RECEIVE_PATH but it is NOT readable. 'scan' command may fail."
    fi
else
    echo "❌ IR Receiver: Not found at default path ($IR_RECEIVE_PATH). You may need to edit tux/infrared.js."
fi
echo ""


echo "--- ✅ Diagnostics Complete ---"

