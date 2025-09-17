#!/bin/sh
# File: flipper-tux/installation.sh

# Flipper TUX Full Installation & Persistence Script
# This script installs the project and sets it up to run 24/7 with a custom URL.
# WARNING: This script requires ROOT and will modify your system's hosts file.

echo "--- 🚀 Flipper TUX Full Installation (24/7 Service) ---"
echo "--- ⚠️ WARNING: ROOT ACCESS IS REQUIRED. ---"
echo ""

# --- Define Paths for Root Environment ---
# Termux's environment isn't available to `su`, so we use absolute paths.
TERMUX_PREFIX="/data/data/com.termux/files/usr"
NPM_PATH="$TERMUX_PREFIX/bin/npm"
PM2_PATH="$TERMUX_PREFIX/bin/pm2"

# --- 1. Root Check ---
if [ "$(id -u)" -ne 0 ]; then
   echo "❌ Error: This script must be run as root."
   echo "Please run with: su -c 'sh installation.sh'"
   exit 1
fi
echo "✅ Root access confirmed."
echo ""

# --- 2. System & Node.js Dependencies ---
echo "--- Step 2: Installing Dependencies ---"
echo "Updating packages..."
pkg update -y && pkg upgrade -y

echo "Installing git, nodejs, termux-api..."
pkg install git nodejs-lts termux-api -y

echo "Installing PM2 globally to manage the server process..."
$NPM_PATH install -g pm2
if [ $? -ne 0 ]; then
    echo "❌ Error: PM2 installation failed. Please check your Node.js/npm setup."
    exit 1
fi
echo "✅ Dependencies installed."
echo ""

# --- 3. Cloning Repository ---
# This part runs in the user's directory before switching to root
# We assume the script is run from within the repo directory or its parent
if [ -d "flipper-tux" ]; then
    echo "👍 Found existing flipper-tux directory. Entering it."
    cd flipper-tux
elif [ -f "package.json" ]; then
    echo "👍 Already inside the flipper-tux directory."
else
    echo "Cloning the Flipper TUX repository..."
    git clone https://github.com/SullyGreene/flipper-tux.git
    if [ $? -ne 0 ]; then
        echo "❌ Error: 'git clone' failed. Please check your internet connection."
        exit 1
    fi
    cd flipper-tux
fi
echo "✅ Repository is ready."
echo ""

# --- 4. Installing Project Dependencies ---
echo "--- Step 4: Installing Project Dependencies ---"
$NPM_PATH install
if [ $? -ne 0 ]; then
    echo "❌ Error: 'npm install' failed."
    exit 1
fi
echo "✅ Node.js dependencies installed."
echo ""

# --- 5. Setting up Custom URL (http://flipper.tux) ---
echo "--- Step 5: Configuring Custom URL ---"
HOSTS_FILE="/system/etc/hosts"
URL_ENTRY="127.0.0.1 flipper.tux"

echo "Attempting to modify $HOSTS_FILE..."
mount -o rw,remount /system

if grep -q "flipper.tux" "$HOSTS_FILE"; then
    echo "👍 Custom URL already exists in hosts file."
else
    echo "Adding '$URL_ENTRY' to hosts file..."
    echo "$URL_ENTRY" >> "$HOSTS_FILE"
    echo "✅ Custom URL added."
fi

mount -o ro,remount /system
echo "✅ Hosts file configured."
echo ""

# --- 6. Setting up 24/7 Service with PM2 ---
echo "--- Step 6: Setting up PM2 for 24/7 Uptime ---"
echo "Starting the server with PM2..."
$PM2_PATH start server.js --name flipper-tux

echo "Saving the PM2 process list to resurrect on reboot..."
$PM2_PATH save

echo "Generating startup script to run PM2 on boot..."
$PM2_PATH startup
echo "✅ PM2 service configured."
echo ""

# --- Final Instructions ---
echo "🎉 --- Installation Complete! --- 🎉"
echo ""
echo "Flipper TUX is now running as a background service."
echo "You can access the Web UI from this device at:"
echo "➡️  http://flipper.tux:3000"
echo ""
echo "To manage the service, use these commands (run as root):"
echo "  - $PM2_PATH status        (Check if the server is running)"
echo "  - $PM2_PATH logs flipper-tux (View server logs)"
echo "  - $PM2_PATH stop flipper-tux  (Stop the server)"
echo "  - $PM2_PATH restart flipper-tux (Restart the server)"
echo ""

