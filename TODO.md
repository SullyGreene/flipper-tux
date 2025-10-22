# Flipper TUX - Project TODO List

This document outlines the development roadmap, bug fixes, and feature enhancements for Flipper TUX. It is generated from a review of the existing codebase.

---

## 🐧 P1: Critical & High Priority

These items address security, core functionality, and major user experience gaps.

-   [ ] **Implement Server-Side PIN Authentication:**
    -   The `installation.sh` script now creates a `.env` file with `DEVICE_PIN`.
    -   The server (`server.js`) must load this PIN using `dotenv`.
    -   Create a middleware to protect all `/api/*` routes.
    -   The middleware should check for an `X-Device-PIN` header (as implemented in `main.js`) and validate it against the PIN from `.env`.
    -   Reject requests with a `401 Unauthorized` or `403 Forbidden` error if the PIN is missing or incorrect.

-   [ ] **Implement Server-Side Discovery Endpoint:**
    -   The frontend (`main.js`) attempts to discover devices by pinging `/api/discover` on port `3691`.
    -   Create a new, unauthenticated endpoint `GET /api/discover` in `server.js`.
    -   This endpoint should return the `DEVICE_NAME` from the `.env` file. Example: `{ "deviceName": "MyAndroid" }`.

-   [ ] **Fix Hardcoded Subnet in Device Discovery:**
    -   `public/js/main.js` currently scans a hardcoded `192.168.1.x` subnet.
    -   This will fail on most other networks.
    -   **Short-term fix:** Detect the user's local subnet in the browser and scan that range.
    -   **Long-term fix:** Implement a more robust discovery method like mDNS (Bonjour) or UDP broadcasts.

-   [ ] **Implement Audit Logging:**
    -   As suggested in `README.md`, create a centralized logging mechanism.
    -   Log critical events (server start, failed auth, root command execution) to a file (e.g., `audit.log`).
    -   Include timestamp, remote IP, endpoint, and the command executed.

---

## 🎨 P2: Frontend & UX

-   [ ] **Fix Battery Status Parsing:**
    -   `main.js` has a `try/catch` block for parsing battery status, indicating it can fail.
    -   The `/api/termux/battery` endpoint returns a JSON string, not a JSON object.
    -   Modify the `executeCommand` utility or the battery route handler to parse the JSON output on the server-side and return a proper JSON object to the client. This simplifies frontend logic.

-   [ ] **Refine PIN Input UX:**
    -   The PIN input in `index.html` automatically focuses the next field on `keyup`. This can be buggy.
    -   Change the event to `input` for more reliable behavior.
    -   Add support for pasting a 4-digit PIN into the first box.

-   [ ] **Improve `start.sh` Interactivity:**
    -   The script is now interactive, which is good.
    -   However, it deviates from the `setup.sh` flow which just runs `npm start`.
    -   Consider moving the interactive prompts to a separate script (e.g., `start-interactive.sh`) and have `start.sh` simply run `setup.sh` and then `npm start` for consistency with the README.

-   [ ] **Improve `stop.sh` Precision:**
    -   The script uses `pkill -f "node server.js"`, which is broad.
    -   Modify `start.sh`'s background mode to save the process ID (PID) to `server.pid`.
    -   Update `stop.sh` to read the PID from `server.pid` and kill that specific process first, falling back to `pkill` if the file doesn't exist.

---

## ⚙️ P3: Backend & Features

-   [ ] **Implement `--readonly` Mode:**
    -   Add command-line argument parsing (e.g., using `yargs` or `minimist`) to `server.js`.
    -   If a `--readonly` flag is present, create a middleware that blocks all requests to `/api/root/*` and any other state-changing endpoints (like POST requests).

-   [ ] **Default Server to Localhost Binding:**
    -   For security, the Express server should default to listening on `127.0.0.1`.
    -   Allow binding to `0.0.0.0` (all interfaces) via an environment variable in the `.env` file (e.g., `HOST=0.0.0.0`).

-   [ ] **Add New Root Commands from `routes/root.js` to UI:**
    -   The `root.js` file defines several new endpoints (`/dmesg`, `/logcat`, `/processes`, `/ls-root`, `/whoami`).
    -   Add buttons to `index.html` for these new diagnostic commands.

-   [ ] **Add New Termux Commands from `routes/termux.js` to UI:**
    -   The `termux.js` file defines many new endpoints (`/device-info`, `/contact-list`, `/clipboard/get`, `/clipboard/set`, `/notification`, `/tts-speak`, `/wifi-info`, `/telephony-info`, `/camera/photo`).
    -   Add buttons and forms to the UI to interact with these new Termux:API features.

-   [ ] **Refactor `infrared.js` Module:**
    -   The `scan` command uses a complex, multi-line shell command. This is hard to maintain.
    -   Refactor it to execute the `su -c 'timeout...'` command and process the output within the Node.js `execute` function, rather than in the shell.

---

## 📚 P4: Documentation & Cleanup

-   [ ] **Update `README.md` for Multi-Device UI:**
    -   The "Quickstart" guide is now slightly out of date. It should direct users to open the UI in their browser and let the discovery feature find the device, rather than manually finding the IP.
    -   Update the "Full Installation" guide to reflect that the UI now supports the PIN and custom URL.
    -   Update the API documentation to include the new endpoints.

-   [ ] **Create `server.js` if it doesn't exist:**
    -   The project structure implies a central `server.js` file that ties together Express, routes, and middleware. Ensure this file is created and properly structured.

-   [ ] **Standardize Port Usage:**
    -   `main.js` uses port `3691` for discovery.
    -   `start.sh` and the README use port `3000`.
    -   Decide on a single port and use it consistently. Store it in the `.env` file and have both the server and frontend reference it.

-   [ ] **Review `installation.sh` Cloning Logic:**
    -   The script has logic to `cd flipper-tux` but it's run with `tsu sh installation.sh` from *within* the directory. This could be simplified as the user is expected to already be in the project root.

```

This `TODO.md` file provides a structured plan to guide the next stages of development for Flipper TUX.

<!--
[PROMPT_SUGGESTION]Let's start with the first critical task: Implement the server-side PIN authentication and the `/api/discover` endpoint in `server.js`.[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Show me how to fix the hardcoded subnet in `public/js/main.js` by detecting the user's local network.[/PROMPT_SUGGESTION]
