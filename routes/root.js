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

// WARNING: Reboot the device. This is a dangerous command.
router.post('/reboot', (req, res) => {
    executeCommand("su -c 'reboot'", res);
});

// Scan for nearby Wi-Fi networks using 'iw'
router.get('/wifi/scan', (req, res) => {
    // This command requires the 'wlan0' interface, which is standard but not guaranteed.
    executeCommand("su -c 'iw dev wlan0 scan'", res);
});

// Enable or disable the Wi-Fi interface using the service manager 'svc'
router.post('/wifi/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc wifi ${state}'`, res);
});

// Scan for nearby Bluetooth devices using 'bluetoothctl'
router.get('/bluetooth/scan', (req, res) => {
    // Note: This command starts an interactive scan and may not exit cleanly on its own.
    // A timeout or more advanced handling might be needed for production use.
    executeCommand("su -c 'bluetoothctl scan on'", res);
});

// Enable or disable the NFC interface using the service manager 'svc'
router.post('/nfc/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc nfc ${state}'`, res);
});

module.exports = router;

