// File: flipper-tux/tux/infrared.js
/**
 * @file Real Infrared Remote Module
 * @description Scans, saves, and transmits real IR codes using a rooted device's hardware.
 * @warning This is hardware-dependent. The file paths used may need to be changed for your device.
 */
const fs = require('fs');
const path = require('path');

// Path to the JSON file where saved remote codes will be stored.
const codesDbPath = path.join(__dirname, 'ir_codes.json');

// --- Helper Functions ---
const readCodes = () => {
    try {
        if (fs.existsSync(codesDbPath)) {
            const data = fs.readFileSync(codesDbPath);
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("❌ Error reading ir_codes.json:", err);
    }
    return {}; // Return empty object if file doesn't exist or is invalid
};

const saveCode = (name, rawCode) => {
    const codes = readCodes();
    codes[name] = rawCode;
    try {
        fs.writeFileSync(codesDbPath, JSON.stringify(codes, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error saving to ir_codes.json:", err);
        return false;
    }
};

// --- Module Definition ---
module.exports = {
    name: 'infrared',
    description: 'A real IR universal remote. Clone, save, and send signals.',
    commands: {
        list: {
            description: 'Lists all saved remote control buttons from ir_codes.json.',
            execute: (req, res, executeCommand) => {
                const codes = readCodes();
                const savedButtons = Object.keys(codes);
                if (savedButtons.length === 0) {
                    return executeCommand('echo "No remote codes saved yet. Use the /scan command to begin."
', res);
                }
                const output = "--- 💾 Saved Remote Buttons ---\n" + savedButtons.map(b => ` - ${b}`).join('\n');
                executeCommand(`echo "${output}"`, res);
            }
        },
        scan: {
            description: 'Starts a 10-second scan to capture a raw IR code from a remote.',
            execute: (req, res, executeCommand) => {
                // IMPORTANT: '/dev/lirc0' is a GUESS. The path for your IR receiver might be different.
                // This command attempts to read raw data from the IR receiver device.
                const command = `
                    echo "🔴 SCANNING: Point your remote at the phone's IR port and press a button.";
                    echo "Waiting for a signal for 10 seconds...";
                    su -c 'timeout 10 cat /dev/lirc0 | od -An -t u4 | head -n 1'
                `;
                executeCommand(command, res, { timeout: 12000 });
            }
        },
        save: {
            description: 'Saves a captured IR code. Params: ?name=my_button_name&code=RAW_CODE',
            execute: (req, res, executeCommand) => {
                const { name, code } = req.query;

                if (!name || !code) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing 'name' or 'code' query parameter. Both are required."
                    });
                }

                if (saveCode(name, code)) {
                    executeCommand(`echo "✅ Saved button '${name}' successfully!"`, res);
                } else {
                    res.status(500).json({
                        success: false,
                        message: "Failed to write code to ir_codes.json on the server."
                    });
                }
            }
        },
        send: {
            description: 'Transmits a saved IR code. Param: ?name=my_button_name',
            execute: (req, res, executeCommand) => {
                const { name } = req.query;
                if (!name) {
                    return res.status(400).json({ success: false, message: "Missing 'name' query parameter." });
                }

                const codes = readCodes();
                const rawCode = codes[name];

                if (!rawCode) {
                    return res.status(404).json({ success: false, message: `Button '${name}' not found in ir_codes.json.` });
                }

                // IMPORTANT: '/sys/class/remote/transmit' is a GUESS. Your IR blaster path may differ.
                // This command writes the raw code to the IR blaster driver.
                const command = `su -c 'echo "${rawCode}" > /sys/class/remote/transmit'`;
                
                const pre_command = `echo "🚀 Transmitting code for '${name}'..."`;
                executeCommand(`${pre_command} && ${command}`, res);
            }
        }
    }
};

