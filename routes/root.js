// File: flipper-tux/routes/root.js
/**
 * @file Root API Routes
 * @description Routes for commands that require root privileges. USE WITH CAUTION.
 */
const express = require('express');
const router = express.Router();
const executeCommand = require('../utils/commandExecutor');

// --- Root-Powered Endpoints ---

// Check which user the command is running as (should be 'root')
router.get('/whoami', (req, res) => {
    executeCommand("su -c 'whoami'", res);
});

// --- Device Control (Dangerous Actions) ---

// WARNING: Reboot the device.
// NOTE: This now uses POST. The frontend must be updated to send a POST request.
router.post('/reboot', (req, res) => {
    executeCommand("su -c 'reboot'", res);
});

// WARNING: Shut down the device.
// NOTE: This uses POST. The frontend must be updated to send a POST request.
router.post('/shutdown', (req, res) => {
    executeCommand("su -c 'reboot -p'", res); // -p flag powers off the device
});


// --- Network Control ---

// Scan for nearby Wi-Fi networks using 'iw'
router.get('/wifi/scan', (req, res) => {
    // This command requires the 'wlan0' interface, which is standard but not guaranteed.
    // Give it a longer timeout as scanning can take time.
    executeCommand("su -c 'iw dev wlan0 scan'", res, { timeout: 15000 });
});

// Enable or disable the Wi-Fi interface using the service manager 'svc'
router.get('/wifi/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc wifi ${state}'`, res);
});

// Scan for nearby Bluetooth devices using 'bluetoothctl'
router.get('/bluetooth/scan', (req, res) => {
    // Use 'timeout' command to prevent the process from hanging.
    // This will run the scan for 8 seconds.
    executeCommand("su -c 'timeout 8s bluetoothctl scan on'", res, { timeout: 10000 });
});

// Enable or disable the NFC interface using the service manager 'svc'
router.get('/nfc/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc nfc ${state}'`, res);
});


// --- System Diagnostics ---

// Get the last 20 lines of the kernel message buffer (dmesg)
router.get('/dmesg', (req, res) => {
    executeCommand("su -c 'dmesg | tail -n 20'", res);
});

// Get the last 20 lines of the Android logcat
router.get('/logcat', (req, res) => {
    // -d dumps the log and exits, -t 20 gets the last 20 lines.
    executeCommand("su -c 'logcat -d -t 20'", res, { timeout: 15000 });
});

// List all running processes
router.get('/processes', (req, res) => {
    executeCommand("su -c 'ps -ef'", res);
});

// List the contents of the root directory
router.get('/ls-root', (req, res) => {
    executeCommand("su -c 'ls -la /'", res);
});


module.exports = router;

