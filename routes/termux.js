// File: flipper-tux/routes/termux.js
/**
 * @file Termux API Routes
 * @description Routes for interacting with the Termux:API (non-root).
 */
const express = require('express');
const router = express.Router();
const executeCommand = require('../utils/commandExecutor');
const { exec } = require('child_process');


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
    executeCommand('termux-device-info', res);
});

// Get a list of contacts from the device (JSON output)
router.get('/contact-list', (req, res) => {
    executeCommand('termux-contact-list', res);
});

// Get the current content of the system clipboard
router.get('/clipboard/get', (req, res) => {
    executeCommand('termux-clipboard-get', res);
});

// Set the system clipboard text
router.post('/clipboard/set', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, message: "Request body must contain 'text' property." });
    }
    // We need to pipe the text to the command's stdin
    const child = exec(`termux-clipboard-set`, (error, stdout, stderr) => {
         if (error) {
            console.error(`[EXEC] ❌ Error executing command: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message, stderr });
        }
        res.json({ success: true, output: 'Clipboard set successfully.' });
    });
    child.stdin.write(text);
    child.stdin.end();
});

// Create a system notification
router.post('/notification', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: "Request body must contain 'title' and 'content' properties." });
    }
    // Sanitize input to prevent command injection
    const safeTitle = JSON.stringify(title);
    const safeContent = JSON.stringify(content);
    executeCommand(`termux-notification --title ${safeTitle} --content ${safeContent}`, res);
});

// Use Text-To-Speech to speak a message
router.post('/tts-speak', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, message: "Request body must contain 'text' property." });
    }
    const child = exec('termux-tts-speak', (error, stdout, stderr) => {
        if (error) {
            console.error(`[EXEC] ❌ Error executing command: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message, stderr });
        }
        res.json({ success: true, output: 'TTS command executed.' });
    });
    child.stdin.write(text);
    child.stdin.end();
});

// Get current Wi-Fi connection information
router.get('/wifi-info', (req, res) => {
    executeCommand('termux-wifi-connectioninfo', res);
});

// Get telephony device information (SIM, network, etc.)
router.get('/telephony-info', (req, res) => {
    executeCommand('termux-telephony-deviceinfo', res);
});

// Take a photo with the back camera and save it
router.post('/camera/photo', (req, res) => {
    // Photos will be saved in the /data/data/com.termux/files/home/ directory
    const filePath = `flipper-tux-photo-${Date.now()}.jpg`;
    executeCommand(`termux-camera-photo -c 0 ${filePath}`, res, { timeout: 20000 });
});


module.exports = router;
