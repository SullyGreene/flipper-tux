// File: flipper-tux/routes/termux.js
/**
 * @file Termux API Routes
 * @description Routes for interacting with the Termux:API (non-root).
 */
const express = require('express');
const router = express.Router();
const executeCommand = require('../utils/commandExecutor');

// --- Termux API Endpoints ---

// Get battery status (JSON output)
router.get('/battery', (req, res) => {
    executeCommand('termux-battery-status', res);
});

// Vibrate the device for a set duration
router.get('/vibrate', (req, res) => {
    // Vibrate for 500ms by default
    executeCommand('termux-vibrate -d 500', res);
});

// Turn the flashlight on or off
router.get('/flashlight/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'on' : 'off';
    executeCommand(`termux-torch ${state}`, res);
});

// Get detailed device information (JSON output)
router.get('/device-info', (req, res) => {
    executeCommand('termux-api-info', res);
});

// Get a list of contacts from the device (JSON output)
router.get('/contact-list', (req, res) => {
    executeCommand('termux-contact-list', res);
});

module.exports = router;

