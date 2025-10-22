#!/bin/bash
#
# Flipper TUX - Setup Script
# This script automates the initial setup for new users.
#

# --- Colors for output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- 🚀 Starting Flipper TUX Setup ---${NC}"

# --- Step 1: Update Termux packages ---
echo -e "\n${YELLOW}Step 1: Updating Termux packages...${NC}"
if ! pkg update -y; then
    echo -e "${RED}❌ Error: 'pkg update' failed. Please check your internet connection and Termux repositories.${NC}"
    exit 1
fi
if ! pkg upgrade -y; then
    echo -e "${RED}❌ Error: 'pkg upgrade' failed. Please check your internet connection and Termux repositories.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Termux packages are up to date.${NC}"

# --- Step 2: Install required packages ---
echo -e "\n${YELLOW}Step 2: Installing core dependencies (git, nodejs-lts, termux-api)...${NC}"
if ! pkg install -y git nodejs-lts termux-api; then
    echo -e "${RED}❌ Error: Failed to install core dependencies. Please ensure Termux repositories are accessible.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Core dependencies installed.${NC}"

# --- Step 3: Check for Termux:API app ---
echo -e "\n${YELLOW}Step 3: Verifying Termux:API...${NC}"
if ! command -v termux-battery-status &> /dev/null; then
    echo -e "\n${RED}❌ Error: Termux:API commands not found.${NC}"
    echo -e "${YELLOW}Please make sure you have installed the Termux:API app from F-Droid.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Termux:API is available.${NC}"

# --- Step 4: Install Node.js dependencies ---
echo -e "\n${YELLOW}Step 4: Installing Node.js project dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: 'npm install' failed. Please check for errors.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Error: package.json not found! Make sure you are in the project root directory.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js dependencies installed.${NC}"

# --- Step 5: Create 'tux' directory for modules ---
if [ ! -d "tux" ]; then
    echo -e "\n${YELLOW}Step 5: Creating 'tux' directory for custom modules...${NC}"
    mkdir tux
    echo -e "${GREEN}✅ 'tux' directory created.${NC}"
fi

echo -e "\n${GREEN}### 🎉 Flipper TUX setup is complete! ###${NC}"
echo -e "You can now start the server by running: ${YELLOW}npm start${NC}"
