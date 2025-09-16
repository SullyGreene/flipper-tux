#!/bin/bash
#
# Flipper TUX - Server Start Script (Interactive)
# This script checks dependencies and starts the Node.js server with user-defined options.
#

# --- Colors for output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- Preparing to start 🐧 Flipper TUX Server ---${NC}"

# --- Check 1: Ensure Node.js is installed ---
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed.${NC}"
    echo -e "${YELLOW}Please run 'pkg install nodejs-lts' or run the setup.sh script.${NC}"
    exit 1
fi

# --- Check 2: Ensure dependencies are installed ---
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️ Warning: 'node_modules' directory not found.${NC}"
    echo -e "Running 'npm install' automatically..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: 'npm install' failed. Please check for errors.${NC}"
        exit 1
    fi
fi

# --- Check 3: Ensure 'tux' directory exists ---
if [ ! -d "tux" ]; then
    echo -e "${YELLOW}⚠️ Warning: 'tux' module directory not found. Creating it now...${NC}"
    mkdir tux
fi

echo -e "\n${CYAN}--- Server Configuration ---${NC}"

# --- CLI Interaction: Port Selection ---
read -p "Enter the port to run on [3000]: " PORT
PORT=${PORT:-3000} # Default to 3000 if empty

# --- CLI Interaction: Background Mode ---
read -p "Run in the background? (y/n) [n]: " RUN_BG
RUN_BG=${RUN_BG:-n}

# --- Start the server ---
echo -e "\n${GREEN}✔ All checks passed. Starting server...${NC}"
clear

# Set the PORT environment variable for the node process
export PORT

if [[ "$RUN_BG" == "y" || "$RUN_BG" == "Y" ]]; then
    # Start in background, redirect output to a log file, and save the PID
    nohup node server.js > flipper-tux.log 2>&1 &
    echo $! > server.pid
    echo -e "${GREEN}🐧 Server started in the background on port ${PORT}.${NC}"
    echo -e "Output is being logged to ${YELLOW}flipper-tux.log${NC}"
    echo -e "To stop the server, run: ${YELLOW}npm run stop${NC}"
else
    # Start in foreground
    node server.js
fi

