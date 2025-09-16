const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper function to execute shell commands.
 * @param {string} command The command to execute.
 * @param {boolean} isRoot Whether the command requires root privileges.
 * @param {object} res The Express response object.
 */
const executeCommand = (command, isRoot, res) => {
    const fullCommand = isRoot ? `su -c "${command}"` : command;
    console.log(`Executing: ${fullCommand}`);

    exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Command failed: ${error.message}`,
                stderr: stderr
            });
        }
        if (stderr) {
            console.warn(`Stderr: ${stderr}`);
        }
        res.json({ success: true, output: stdout.trim() });
    });
};

// --- API Routes ---

// Test route to confirm the server is running
app.get('/api/test', (req, res) => {
    executeCommand('echo "Server is alive!"', false, res);
});

// --- Phase 2: Termux API Routes (Non-Root) ---

app.get('/api/termux/battery', (req, res) => {
    executeCommand('termux-battery-status', false, res);
});

app.get('/api/termux/flashlight/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'on' : 'off';
    executeCommand(`termux-torch ${state}`, false, res);
});

app.get('/api/termux/vibrate', (req, res) => {
    executeCommand('termux-vibrate -d 500', false, res);
});

// --- Phase 3: Advanced Hardware Routes (Root Required) ---

app.get('/api/root/wifi/scan', (req, res) => {
    // This command requires a tool like 'iw' which may need to be installed.
    // The device's Wi-Fi interface name (e.g., wlan0) might also vary.
    executeCommand('iw dev wlan0 scan', true, res);
});

app.get('/api/root/bluetooth/scan', (req, res) => {
    // This uses bluetoothctl in a non-interactive way.
    // It starts a scan for 5 seconds and then prints the found devices.
    const command = "timeout 5s bluetoothctl --discoverable=yes scan on && bluetoothctl devices";
    executeCommand(command, true, res);
});

app.get('/api/root/nfc/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    // Uses Android's service call (svc) command to control the NFC service.
    executeCommand(`svc nfc ${state}`, true, res);
});

// --- Server Start ---

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n--- Flipper TUX Server ---`);
    console.log(`Server listening on all network interfaces at port ${PORT}`);
    console.log(`Access the UI from another device at: http://<your-phone-ip>:${PORT}`);
    console.log('----------------------------\n');
});
