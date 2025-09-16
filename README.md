# Flipper TUX — Web UI for Rooted Android

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Turn a rooted Android device into a hardware control and testing tool — accessible from any web browser on your local network.

## ⚠️ Important Disclaimer

This project runs **root** commands. Misuse can permanently damage or "brick" your device. **Proceed at your own risk.** The author is not responsible for any damage.

## Summary

Flipper TUX runs a Node.js Express server inside Termux on a rooted Android device and serves a small web UI for controlling hardware/features such as flashlight, vibration, Wi‑Fi scanning and more. The backend uses the Termux API for non-root features and `su -c` for privileged operations.

## Key Features

* Responsive web interface (HTML / CSS / JS)
* Runs under Termux (Node.js + Express)
* Uses Termux\:API for non-root interactions
* Optional root commands for advanced control (Wi‑Fi/Bluetooth/NFC scanning, etc.)

## Architecture

* **Frontend:** `public/index.html`, `public/css/style.css`, `public/js/main.js`
* **Backend:** `server.js` — Express server, executes shell commands using `child_process`.
* **Environment:** Termux on a rooted Android device; Termux\:API available for some features.

## Prerequisites

* Rooted Android device
* Termux (install from F‑Droid)
* Termux\:API app (install from F‑Droid)
* Basic familiarity with the Android shell and `su`

## Quickstart

Clone the repository and start the server inside Termux:

```bash
git clone https://github.com/SullyGreene/flipper-tux.git
cd flipper-tux
bash start.sh
```

`start.sh` will install dependencies and start the Node.js server (default port `3000`).

Find your device IP (for example via `ifconfig`) and open in a browser on the same network:

```
http://<your-device-ip>:3000
```

## Usage

The frontend provides buttons/controls that call backend endpoints. The backend chooses the correct execution method depending on whether the action requires root.

### Example endpoints

* `GET /api/test` — server health check
* `GET /api/termux/battery` — read battery status (Termux\:API)
* `GET /api/termux/flashlight/:state` — toggle flashlight (`on` / `off`)
* `GET /api/termux/vibrate` — vibrate device
* `GET /api/root/wifi/scan` — (root) scan Wi‑Fi networks
* `GET /api/root/bluetooth/scan` — (root) scan Bluetooth devices
* `GET /api/root/nfc/:state` — (root) enable/disable NFC (`enable` / `disable`)

> See `server.js` for exact command implementations and how `su -c` is used for privileged actions.

## Security & Safety Notes

* **Root access is powerful and dangerous.** Only enable root commands if you understand the risks.
* Do not expose this server to untrusted networks. Bind the server to local interfaces only, or use firewalling / VPN.
* Consider adding authentication (basic auth / token) before allowing access to privileged endpoints.
* Validate and sanitize any input that becomes part of shell commands to avoid command injection.

## Development

* Frontend files live in `public/`.
* Server implementation is `server.js`.
* `start.sh` installs Node.js dependencies and launches the server.

Suggested improvements:

* Add authentication for the web UI (Basic / JWT)
* Add an audit log for executed root commands
* Provide an optional read‑only mode for safer testing

## Contributing

Contributions welcome — please open issues or pull requests. When contributing, include:

* A clear description of the change
* Safety/security considerations for any root-level features

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

*Made with care — use wisely.*
