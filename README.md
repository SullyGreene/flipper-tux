# Flipper TUX — Web UI for Rooted Android

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/SullyGreene/flipper-tux)](https://github.com/SullyGreene/flipper-tux/releases)

> Lightweight web-based hardware control + testing UI for rooted Android devices running Termux.

---

## Overview

Flipper TUX provides a small Node.js/Express server that runs inside **Termux** on a rooted Android device and exposes a browser‑based UI to control device features (flashlight, vibration, Wi‑Fi scanning, NFC, Bluetooth, etc.). It uses the **Termux\:API** for standard operations and `su -c '…'` for privileged commands where root is required.

This README focuses on getting you up and running quickly and safely.

---

## Getting Started: The Beginner's Guide

This guide will walk you through setting up Flipper TUX on your rooted Android device. We'll cover two main ways to run it: a quick, temporary session, and a full, persistent installation that runs 24/7.

---

### 1. Prerequisites: What You Need

Before you begin, ensure you have the following:

*   **A Rooted Android Device**: Flipper TUX leverages root access for powerful features like Wi-Fi/Bluetooth scanning and NFC control. Without root, many core functionalities will not work.
*   **Termux (from F-Droid)**:
    *   **Important**: Install Termux from F-Droid (the open-source app store), **NOT** the Google Play Store. The Play Store version is outdated and may cause issues.
    *   Termux provides a Linux environment on Android, allowing us to run Node.js and other command-line tools.
*   **Termux:API (from F-Droid)**:
    *   Install the Termux:API app from F-Droid. This app provides a bridge between Termux commands and Android's native APIs (e.g., flashlight, vibration, battery status).
    *   After installation, grant all necessary permissions to both Termux and Termux:API apps in your Android settings.
*   **Network Access**: Your Android device and the computer/phone you'll use to access the Flipper TUX web UI must be on the same Wi-Fi network (Local Area Network - LAN).

---

### 2. Initial Setup (Quickstart - Temporary Session)

This method gets Flipper TUX running quickly for a single session. The server will stop if you close Termux or reboot your device.

**Steps:**

1.  **Open Termux & Update Packages:**
    *   Launch the Termux app on your Android device.
    *   Update Termux's package list and upgrade any installed packages to their latest versions. This ensures you have the most stable environment.
    ```bash
    pkg update -y && pkg upgrade -y
    ```

2.  **Install Core Tools:**
    *   Install `git` (for cloning the repository) and `nodejs-lts` (the runtime for Flipper TUX).
    ```bash
    pkg install git nodejs-lts -y
    ```

3.  **Get Flipper TUX Code:**
    *   Clone the Flipper TUX repository from GitHub. This downloads all the project files to your Termux home directory.
    *   Then, navigate into the newly created `flipper-tux` directory.
    ```bash
    git clone https://github.com/SullyGreene/flipper-tux.git
    cd flipper-tux
    ```

4.  **Run the Setup Script (`start.sh`):**
    *   The `start.sh` script is a helper that runs `setup.sh` (to install Node.js dependencies and verify Termux:API) and then starts the Flipper TUX server using `npm start`.
    *   **Review `start.sh` first (safety first!)** to understand what it does.
    ```bash
    bash start.sh
    ```
    *   You will see output indicating package installations and then the server starting.

5.  **Find Your Device's IP Address:**
    *   While the Flipper TUX server is running in Termux, open a **new Termux session** (swipe from the left edge of the screen and select "New Session").
    *   Type one of the following commands to find your device's local IP address:
    ```bash
    ip addr show wlan0 | grep inet
    # or (if 'ip' command is not found)
    ifconfig wlan0
    ```
    *   Look for an address like `192.168.X.Y` or `10.0.X.Y`. This is your device's local network address.

6.  **Access the Web UI:**
    *   On a computer or another phone connected to the **same Wi-Fi network**, open a web browser.
    *   Enter the IP address you found, followed by `:3000` (the default port for Flipper TUX).
    ```
    http://<your-device-ip>:3691
    ```
    *   **Example**: If your IP is `192.168.1.100`, you would visit `http://192.168.1.100:3000`.

7.  **What to Expect (First Run):**
    *   You should see the Flipper TUX web interface.
    *   Initially, you might see a landing page or the main control panel.
    *   Test some of the basic Termux:API functions like "Battery Status" or "Flashlight" to confirm everything is working.
    *   **Note**: If a PIN is configured, you will be prompted to enter it before accessing the control panel.
    
8.  **Stopping the Temporary Session:**
    *   To stop the Flipper TUX server, go back to the Termux session where it's running and press `Ctrl+C`.
    *   Alternatively, you can use the `stop.sh` script:
    ```bash
    bash stop.sh
    ```

---

### 3. Full Installation (24/7 Service, Custom URL & PIN Authentication - Requires Root)

This method sets up Flipper TUX to run continuously in the background, even after reboots, and configures a custom local URL (`http://flipper.tux:3000`) for easier access. **This process requires root access.**

**Why use Full Installation?**
*   **Persistence**: Flipper TUX starts automatically when your device boots up.
*   **Custom URL**: Access the UI using `http://flipper.tux:3000` instead of an IP address.
*   **PM2 Management**: Uses PM2 (Process Manager 2) to keep the Node.js server running reliably.

**Steps:**

1.  **Ensure Initial Setup is Done:**
    *   Make sure you have completed **Steps 1-3** from the "Initial Setup (Quickstart)" section above (Termux, Termux:API, `git`, `nodejs-lts`, and the Flipper TUX repository cloned).
    *   You should be inside the `flipper-tux` directory in Termux.

2.  **Run the Full Installation Script (`installation.sh`):**
    *   This script will install additional dependencies (like `tsu` for root commands), set up PM2, configure your device's identity, and modify your `/system/etc/hosts` file for the custom URL.
    *   **Important**: This script requires you to run it with `tsu` (Termux `su` command).
    ```bash
    tsu sh installation.sh
    ```
    *   Grant root access when prompted by your superuser manager (e.g., Magisk).

3.  **Configure Device Name and PIN:**
    *   The script will prompt you to enter a unique name for your device and a 4-digit PIN. This information is saved in a `.env` file and will be used for future multi-device management and authentication.
    *   **Important**: This PIN is now required to access all protected API routes.

4.  **Accessing the 24/7 Service:**
    *   Once the `installation.sh` script completes, Flipper TUX will be running in the background.
    *   You can now access the web UI from any device on the same network using the custom URL, or by discovering the device:
    ```
    http://flipper.tux:3691
    ```

5.  **Managing the 24/7 Service (PM2 Commands):**
    *   Flipper TUX is now managed by PM2. You can use the following commands (run with `tsu`) to control the service:
    ```bash
    tsu pm2 status              # Check if the server is running
    tsu pm2 logs flipper-tux    # View server logs
    tsu pm2 stop flipper-tux    # Stop the server
    tsu pm2 restart flipper-tux # Restart the server
    tsu pm2 delete flipper-tux  # Remove the server from PM2 management
    ```

---

## What’s included

* `public/` — static frontend files (`index.html`, `css/style.css`, `js/main.js`).
* `server.js` — Express backend; routes under `/api/termux` and `/api/root`.
* `start.sh`, `setup.sh`, `update.sh`, `stop.sh`, `uninstall.sh`, `diagnostics.sh`, `backup.sh` — helper scripts.
* `package.json`, `LICENSE`, `README.md`.

---

## API overview (short)

Use the web UI or HTTP requests to these endpoints:

* `GET /api/discover` — returns device name for discovery (unauthenticated)
* `GET /api/server-info` — returns detailed server and module info (authenticated)
* `GET /api/test` — health check
* `GET /api/termux/battery` — battery status (Termux\:API)
* `GET /api/termux/flashlight/:state` — `on` / `off`
* `GET /api/termux/vibrate` — vibrate device
* `GET /api/root/wifi/scan` — root Wi‑Fi scan
* `GET /api/root/bluetooth/scan` — root Bluetooth scan
* `GET /api/root/nfc/:state` — `enable` / `disable` NFC

> See `server.js` for full command strings and implementation details.

---

## Security & Safety (read this first)

Root access is powerful. Follow these safety recommendations before using Flipper TUX outside a trusted, local environment:

1. **Do not expose this server to the public Internet.** Keep it on your local network or localhost only.
2. **Review scripts and server code before running.** Understand which commands run under `su`. Always exercise caution with root commands.
3. **Authentication is now implemented.** Flipper TUX uses a 4-digit PIN (`DEVICE_PIN` in `.env`) for authentication. All protected API routes require an `X-Device-PIN` header. Ensure your PIN is strong and kept secret.
4. **Audit Logging is enabled.** Critical server events, including failed authentication attempts and successful API requests, are logged to `audit.log` for security monitoring.
5. **Bind to localhost when possible.** The server currently binds to `0.0.0.0` by default for easier discovery. For maximum security, consider binding to `127.0.0.1` and using `adb reverse` or an SSH tunnel for remote access.
6. **Sanitize inputs.** Any endpoint that interpolates values into shell commands must validate those values to avoid command injection.
7. **Backup and test on a spare device first.** If possible, test in an emulator or secondary device before using on your daily driver.

---

## Quick hardening checklist

*   **PIN Authentication is implemented.** Ensure you have set a strong `DEVICE_PIN` during installation.
*   **Audit Logging is implemented.** Monitor `audit.log` for suspicious activity.
* Limit server listen address to `127.0.0.1` by default; make remote binding opt-in via `.env`.
* Add a `--readonly` flag that disables all `/api/root/*` endpoints.

---

## Troubleshooting

*   **Cannot connect to device / Authentication failed:** Ensure you are providing the correct 4-digit PIN in the UI. Check `audit.log` on the server for failed authentication attempts.
*   **Device not discovered:** Ensure your Android device and the client are on the same Wi-Fi network. The discovery mechanism scans common subnets (192.168.0.x, 192.168.1.x, 10.0.0.x, 172.16.0.x) on port `3691`.
* **Can't reach UI from another device:** Confirm the phone and client are on the same Wi‑Fi; check `ip addr` output and confirm server is listening (`ss -tulpn | grep node`).
* **`start.sh` fails to install packages:** Run its commands manually to inspect errors. Ensure Termux has storage permissions if the script writes files.
* **Flashlight command not working:** Confirm your device model supports the used termux\:api command or try running the shell command (shown in `server.js`) directly in Termux.

---

## Example: Add Basic Auth (drop-in)

Add this to `server.js` near the top (example, replace with more secure secret management in production):

```js
// simple basic auth middleware
const basicAuth = (req, res, next) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.split(' ')[1] || '';
  const credentials = Buffer.from(token, 'base64').toString(); // "user:pass"
  const [user, pass] = credentials.split(':');
  if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Flipper TUX"');
  return res.status(401).send('Authentication required');
};

// then apply
app.use(basicAuth);
```

Create a `.env` with `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` and ensure `start.sh` loads it (or set env vars manually).

---

## Contributing

If you want to contribute:

* Open an issue describing the feature or bug.
* Pull requests should include tests where applicable and note security implications when touching root code.

Suggested first PRs:

* Add Basic Auth and README docs for setup
* Implement `--readonly` mode and tests
* Add an audit log and centralize command execution

---

## License

MIT — see `LICENSE`.

---
