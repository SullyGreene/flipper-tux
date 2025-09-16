# Flipper TUX — Web UI for Rooted Android

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/SullyGreene/flipper-tux)](https://github.com/SullyGreene/flipper-tux/releases)

> Lightweight web-based hardware control + testing UI for rooted Android devices running Termux.

---

## Overview

Flipper TUX provides a small Node.js/Express server that runs inside **Termux** on a rooted Android device and exposes a browser‑based UI to control device features (flashlight, vibration, Wi‑Fi scanning, NFC, Bluetooth, etc.). It uses the **Termux\:API** for standard operations and `su -c '…'` for privileged commands where root is required.

This README focuses on getting you up and running quickly and safely.

---

## Quickstart — Get up and running (5 minutes)

Prerequisites

* A **rooted Android** device.
* Termux (install from **F-Droid**, not Play Store).
* Termux\:API (install from **F-Droid**).
* A Wi‑Fi network where your Android device and the controlling computer are on the same LAN.

Steps

1. Open Termux and install basic packages (if not already installed):

```bash
pkg update && pkg upgrade -y
pkg install git nodejs -y
```

2. Clone the repository and switch into it:

```bash
git clone https://github.com/SullyGreene/flipper-tux.git
cd flipper-tux
```

3. Review `start.sh` before running it (safety first). Then run the helper script to install dependencies and start the server:

```bash
bash start.sh
```

4. Find your device IP address in Termux:

```bash
ip addr show wlan0 | grep inet
# or
ifconfig wlan0
```

Look for an address like `192.168.x.y`.

5. Open a web browser on your computer or phone on the same network and visit:

```
http://<device-ip>:3000
```

You should see the Flipper TUX web UI.

---

## What’s included

* `public/` — static frontend files (`index.html`, `css/style.css`, `js/main.js`).
* `server.js` — Express backend; routes under `/api/termux` and `/api/root`.
* `start.sh`, `setup.sh`, `update.sh`, `stop.sh`, `uninstall.sh`, `diagnostics.sh`, `backup.sh` — helper scripts.
* `package.json`, `LICENSE`, `README.md`.

---

## API overview (short)

Use the web UI or HTTP requests to these endpoints:

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
2. **Review scripts and server code before running.** Understand which commands run under `su`.
3. **Add authentication.** The repo currently provides no auth by default. Consider one of:

   * HTTP Basic Auth (quick setup)
   * Token-based header (e.g., `X-API-KEY`)
   * JWT for multi-user setups
4. **Bind to localhost when possible.** Edit `server.js` to bind `127.0.0.1` and use `adb reverse` or an SSH tunnel if you need remote access.
5. **Sanitize inputs.** Any endpoint that interpolates values into shell commands must validate those values to avoid command injection.
6. **Backup and test on a spare device first.** If possible, test in an emulator or secondary device before using on your daily driver.

---

## Quick hardening checklist

* Add `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` environment variables and Basic Auth middleware.
* Limit server listen address to `127.0.0.1` by default; make remote binding opt-in via `.env`.
* Create an `audit.log` and log: timestamp, remote IP, endpoint, and sanitized command run.
* Add a `--readonly` flag that disables all `/api/root/*` endpoints.

---

## Troubleshooting

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
