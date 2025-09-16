#!/bin/bash
#
# Flipper TUX - Update Script (Interactive)
# Pulls latest changes from Git, updates dependencies, and handles local changes.
#

# --- Colors and Emojis ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}--- 🐧 Flipper TUX Updater ---${NC}"
echo -e "${YELLOW}This script will stash any local changes, pull the latest code from the repository, and update dependencies.${NC}\n"

# --- Confirmation ---
read -p "Are you sure you want to continue? (y/n) [y]: " CONFIRM
CONFIRM=${CONFIRM:-y}

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo -e "${RED}Update cancelled.${NC}"
    exit 0
fi

# --- Check if it's a git repository ---
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "\n${RED}❌ Error: This is not a git repository. Cannot update.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🔄 Step 1: Handling local changes & fetching updates...${NC}"

# Check if there are local changes to stash
if [[ -n $(git status --porcelain) ]]; then
    echo "  - Stashing local changes..."
    git stash
    STASHED=true
else
    echo "  - No local changes to stash."
    STASHED=false
fi

# Pull latest changes
echo "  - Pulling latest code from the repository..."
git pull
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: 'git pull' failed. Please check for network issues or merge conflicts.${NC}"
    if [ "$STASHED" = true ]; then
        echo "  - Restoring your stashed changes..."
        git stash pop # Restore stashed changes on failure
    fi
    exit 1
fi

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo "  - Restoring stashed changes..."
    git stash pop
fi
echo -e "${GREEN}✅ Code is up-to-date.${NC}"


echo -e "\n${YELLOW}📦 Step 2: Updating Node.js dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: 'npm install' failed. Please check the output for errors.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js dependencies are up-to-date.${NC}"

echo -e "\n${GREEN}--- 🎉 Flipper TUX update is complete! ---${NC}"

