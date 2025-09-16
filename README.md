Flipper TUX - Web UI for Rooted AndroidWelcome to Flipper TUX! This project turns your rooted Android device into a powerful hardware control and testing tool, accessible from a web browser. It runs a Node.js server inside Termux to provide a UI for controlling everything from your device's flashlight to its network interfaces.⚠️DISCLAIMER: This project uses root commands. Misuse can potentially damage or "brick" your device. The author is not responsible for any damage you may cause. Proceed with extreme caution and at your own risk.🏛️ ArchitectureFrontend: A clean, responsive HTML, CSS, and JavaScript interface served statically.Backend: A Node.js Express server running in Termux.Control Layer: The backend executes shell commands using child_process, intelligently switching between the standard Termux API for non-root tasks and su -c '...' for advanced, root-required operations.Environment: Termux on a rooted Android device.🚀 Getting StartedPrerequisitesA rooted Android device.Termux installed from F-Droid.The Termux:API app installed from F-Droid.InstallationClone the project:git clone <repository_url>
cd flipper-tux

Run the startup script:This will install dependencies and start the server.bash start.sh

Access the Web UI:Find your device's local IP address using ifconfig.Open a web browser on any device on the same Wi-Fi network.Navigate to http://<your-device-ip>:3000.🛠️ Project Structureflipper-tux/
├── public/
│   ├── css/
│   │   └── style.css       # Frontend styles
│   ├── js/
│   │   └── main.js         # Frontend JavaScript logic
│   └── index.html          # Main web interface
├── server.js               # Node.js Express backend
├── package.json            # Project dependencies and scripts
├── start.sh                # Installation and startup script
└── README.md               # You are here

API EndpointsGET /api/test: Checks if the server is running.GET /api/termux/battery: Gets battery status.GET /api/termux/flashlight/:state: Toggles flashlight (on/off).GET /api/termux/vibrate: Vibrates the device.GET /api/root/wifi/scan: (Root) Scans for Wi-Fi networks.GET /api/root/bluetooth/scan: (Root) Scans for Bluetooth devices.GET /api/root/nfc/:state: (Root) Enables or disables NFC (enable/disable).📜 LicenseThis project is licensed under the MIT License. See the LICENSE file for details.
