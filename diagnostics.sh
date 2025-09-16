#!/bin/bash

# Flipper TUX Diagnostics Script
# This script checks if all requirements for the project are met.

echo "--- 🩺 Running Flipper TUX Diagnostics ---"
echo ""

# --- Check 1: Root Access ---
echo "1. Checking for Root Access..."
if su -c "echo 'Success'" > /dev/null 2>&1; then
    echo "   ✅ Root access confirmed."
else
    echo "   ❌ Warning: Root access not detected. Advanced features will not work."
fi
echo ""

# --- Check 2: Core Dependencies ---
echo "2. Checking for Core Dependencies..."
command -v node >/dev/null 2>&1 && echo "   ✅ Node.js is installed: $(node -v)" || echo "   ❌ Node.js is NOT installed."
command -v npm >/dev/null 2>&1 && echo "   ✅ npm is installed: $(npm -v)" || echo "   ❌ npm is NOT installed."
command -v git >/dev/null 2>&1 && echo "   ✅ git is installed: $(git --version)" || echo "   ❌ git is NOT installed."
echo ""

# --- Check 3: Termux API ---
echo "3. Checking Termux:API..."
if termux-toast -s "Diagnostics Check" > /dev/null 2>&1; then
    echo "   ✅ Termux:API is responsive."
else
    echo "   ❌ Warning: Termux:API is not working. Ensure the app is installed and permissions are granted."
fi
echo ""

# --- Check 4: Advanced Tools (Root) ---
echo "4. Checking for Advanced Tools (requires root)..."
su -c "command -v iw" >/dev/null 2>&1 && echo "   ✅ 'iw' command found (for Wi-Fi)." || echo "   ℹ️ 'iw' command NOT found."
su -c "command -v bluetoothctl" >/dev/null 2>&1 && echo "   ✅ 'bluetoothctl' command found (for Bluetooth)." || echo "   ℹ️ 'bluetoothctl' command NOT found."
echo ""

echo "--- Diagnostics Complete ---"
