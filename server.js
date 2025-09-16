const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// --- Middlewares ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Middleware to log all incoming API requests for easier debugging
app.use('/api', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.originalUrl}`);
    next();
});


// --- Helper Functions ---

/**
 * A more robust helper function to execute shell commands.
 * It handles logging, root execution, and provides structured JSON responses.
 * @param {string} command The command to execute.
 * @param {boolean} isRoot Whether the command requires root privileges.
 * @param {object} res The Express response object to send the result to.
 */
const executeCommand = (command, isRoot, res) => {
    const fullCommand = isRoot ? `su -c "${command}"` : command;
    console.log(`Executing: ${fullCommand}`);

    exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error for "${fullCommand}": ${error.message}`);
            // Return a detailed error message to the client
            return res.status(500).json({
                success: false,
                message: `Command failed with error: ${error.message}`,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            });
        }
        
        // Some commands output useful info to stderr even on success, so we log it.
        if (stderr) {
            console.warn(`Stderr for "${fullCommand}": ${stderr.trim()}`);
        }

        res.json({
            success: true,
            output: stdout.trim(),
            stderr: stderr.trim() // Also include stderr in success responses for context
        });
    });
};

// --- API Routers ---

// Create dedicated routers for better organization
const termuxRouter = express.Router();
const rootRouter = express.Router();

// --- Termux API Routes (Non-Root) ---

// Get various pieces of device information
termuxRouter.get('/device-info', (req, res) => {
    executeCommand('termux-info', false, res);
});

// Get battery status
termuxRouter.get('/battery', (req, res) => {
    executeCommand('termux-battery-status', false, res);
});

// Toggle flashlight
termuxRouter.get('/flashlight/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'on' : 'off';
    executeCommand(`termux-torch ${state}`, false, res);
});

// Vibrate the device
termuxRouter.get('/vibrate', (req, res) => {
    // Vibrate for 500ms with a default duration.
    executeCommand('termux-vibrate -d 500', false, res);
});

// Get contact list
termuxRouter.get('/contacts', (req, res) => {
    executeCommand('termux-contact-list', false, res);
});

// Get call log
termuxRouter.get('/call-log', (req, res) => {
    executeCommand('termux-call-log', false, res);
});

// Get GPS location
// Note: This requires the Termux:API app to have location permissions.
rootRouter.get('/location', (req, res) => {
    executeCommand('termux-location', false, res);
});


// --- Root API Routes (Root Required) ---

// Wi-Fi related commands
rootRouter.get('/wifi/scan', (req, res) => {
    // The device's Wi-Fi interface name (e.g., wlan0) might vary.
    executeCommand('iw dev wlan0 scan', true, res);
});

rootRouter.get('/wifi/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'enable' : 'disable';
    executeCommand(`svc wifi ${state}`, true, res);
});

// Bluetooth related commands
rootRouter.get('/bluetooth/scan', (req, res) => {
    // This uses bluetoothctl non-interactively. It scans for 5 seconds.
    const command = "timeout 5s bluetoothctl --discoverable=yes scan on && bluetoothctl devices";
    executeCommand(command, true, res);
});

rootRouter.get('/bluetooth/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'enable' : 'disable';
    executeCommand(`svc bluetooth ${state}`, true, res);
});

// Mobile Data related commands
rootRouter.get('/data/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'enable' : 'disable';
    executeCommand(`svc data ${state}`, true, res);
});

// NFC related commands
rootRouter.get('/nfc/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'enable' : 'disable';
    executeCommand(`svc nfc ${state}`, true, res);
});

// System power commands
rootRouter.post('/system/reboot', (req, res) => {
    executeCommand('reboot', true, res);
});

rootRouter.post('/system/shutdown', (req, res) => {
    executeCommand('reboot -p', true, res);
});

// Placeholder for IR Blaster
rootRouter.post('/ir/transmit', (req, res) => {
    // IMPORTANT: This is a placeholder. The actual command is highly device-specific.
    // It often involves echoing codes to a sysfs path like /sys/class/remote/transmit
    const command = `echo "IR code here" > /sys/class/remote/transmit`;
    console.log("Placeholder IR command:", command);
    res.json({ success: true, message: "This is a placeholder for IR functionality." });
});


// --- Register Routers ---
app.use('/api/termux', termuxRouter);
app.use('/api/root', rootRouter);

// Base API route for testing
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: "Flipper TUX API is alive!" });
});


// --- Server Start ---

app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = null;

    // Find the local IP address of the device (usually wlan0)
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        for (const network of networkInterface) {
            if (network.family === 'IPv4' && !network.internal) {
                // Prefer wlan0 if available, otherwise take the first valid IP
                if (interfaceName.includes('wlan')) {
                    ipAddress = network.address;
                } else if (!ipAddress) {
                    ipAddress = network.address;
                }
            }
        }
    }

    console.log(`\n--- Flipper TUX Server is UP ---`);
    console.log(`Server listening on all network interfaces at port ${PORT}`);
    if (ipAddress) {
        console.log(`✅ Access the UI from another device on the same network at: http://${ipAddress}:${PORT}`);
    } else {
        console.log(`⚠️  Could not determine local IP address. You may need to find it manually.`);
    }
    console.log(`----------------------------------\n`);
});

