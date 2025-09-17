#!/bin/sh
# File: flipper-tux/installation.sh

# Flipper TUX Full Installation & Persistence Script
# This script installs the project and sets it up to run 24/7 with a custom URL.
# WARNING: This script requires ROOT and will modify your system's hosts file.

echo "--- 🐧 Flipper TUX Full Installation (24/7 Service) ---"
echo "--- ⚠️ WARNING: ROOT ACCESS IS REQUIRED. ---"
echo ""

# --- Define Paths for Root Environment ---
# tsu inherits the Termux environment, but defining paths is still a good practice.
TERMUX_PREFIX="/data/data/com.termux/files/usr"
NPM_PATH="$TERMUX_PREFIX/bin/npm"
PM2_PATH="$TERMUX_PREFIX/bin/pm2"

# --- 1. Root Check ---
if [ "$(id -u)" -ne 0 ]; then
   echo "❌ Error: This script must be run as root."
   echo "Please run with: tsu sh installation.sh"
   exit 1
fi
echo "✅ Root access confirmed."
echo ""

# --- 2. System & Node.js Dependencies ---
echo "--- Step 2: Installing Dependencies ---"
echo "Updating packages..."
pkg update -y && pkg upgrade -y

echo "Installing git, nodejs, termux-api, and tsu..."
pkg install git nodejs-lts termux-api tsu -y

echo "Installing PM2 globally to manage the server process..."
$NPM_PATH install -g pm2
if [ $? -ne 0 ]; then
    echo "❌ Error: PM2 installation failed. Please check your Node.js/npm setup."
    exit 1
fi
echo "✅ Dependencies installed."
echo ""

# --- 3. Cloning Repository ---
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
# Install dotenv for handling the new .env configuration file
$NPM_PATH install dotenv
$NPM_PATH install
if [ $? -ne 0 ]; then
    echo "❌ Error: 'npm install' failed."
    exit 1
fi
echo "✅ Node.js dependencies installed."
echo ""

# --- 5. Device Configuration ---
echo "--- Step 5: Configuring Device Identity ---"
echo "Each Flipper TUX instance needs a unique name and PIN for discovery and access."
echo ""

# Get Device Name
DEFAULT_NAME=$(hostname)
echo "Enter a unique name for this device (default: $DEFAULT_NAME):"
read -p "> " DEVICE_NAME
DEVICE_NAME=${DEVICE_NAME:-$DEFAULT_NAME}

# Get PIN Code
while true; do
    echo "Enter a 4-digit PIN code to secure this device:"
    read -p "> " DEVICE_PIN
    # Check if it's a 4-digit number
    if [ -n "$DEVICE_PIN" ] && [ "$DEVICE_PIN" -eq "$DEVICE_PIN" ] 2>/dev/null && [ ${#DEVICE_PIN} -eq 4 ]; then
        break
    else
        echo "❌ Invalid input. Please enter exactly 4 numbers."
    fi
done

# Create .env file
echo "Creating configuration file (.env)..."
cat > .env << EOL
# Flipper TUX Environment Configuration
# This file stores the unique identity for this device.
DEVICE_NAME="${DEVICE_NAME}"
DEVICE_PIN="${DEVICE_PIN}"
EOL
echo "✅ Device name and PIN saved to .env file."
echo ""

# --- 6. Setting up Custom URL (http://flipper.tux) ---
echo "--- Step 6: Configuring Custom URL ---"
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

# --- 7. Setting up 24/7 Service with PM2 ---
echo "--- Step 7: Setting up PM2 for 24/7 Uptime ---"
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
echo "This device is now configured with the name: '$DEVICE_NAME'"
echo ""
echo "You can access the Web UI from this device at:"
echo "➡️  http://flipper.tux:3000"
echo "Note: The UI will need to be updated to support the new multi-device landing page and PIN authentication."
echo ""
echo "To manage the service, use these commands (run with tsu):"
echo "  - $PM2_PATH status        (Check if the server is running)"
echo "  - $PM2_PATH logs flipper-tux (View server logs)"
echo "  - $PM2_PATH stop flipper-tux  (Stop the server)"
echo "  - $PM2_PATH restart flipper-tux (Restart the server)"
echo ""

