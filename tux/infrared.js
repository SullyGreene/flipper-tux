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

const writeCodes = (codes) => {
    try {
        fs.writeFileSync(codesDbPath, JSON.stringify(codes, null, 2));
        return true;
    } catch (err) {
        console.error("❌ Error writing to ir_codes.json:", err);
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
                const command = `
                    echo "🔴 SCANNING: Point your remote at the phone's IR port and press a button.";
                    echo "Waiting for a signal for 10 seconds...";
                    RAW_CODE=$(su -c 'timeout 10 cat /dev/lirc0 | od -An -t u4 | head -n 1');
                    if [ -z "$RAW_CODE" ]; then
                        echo "⚠️ No signal detected within 10 seconds.";
                    else
                        echo "✅ Signal captured! Raw Code:";
                        echo "$RAW_CODE";
                    fi
                `;
                executeCommand(command, res, { timeout: 12000 });
            }
        },
        save: {
            description: 'Saves a captured IR code. Params: ?name=my_button_name&code=RAW_CODE',
            execute: (req, res, executeCommand) => {
                let { name, code } = req.query;

                if (!name || !code) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing 'name' or 'code' query parameter. Both are required."
                    });
                }
                
                // **SECURITY FIX**: Sanitize inputs to prevent command injection and invalid characters.
                const sanitizedName = name.replace(/[^a-zA-Z0-9_\-]/g, '');
                const sanitizedCode = code.replace(/[^0-9\s]/g, '').trim();

                if (sanitizedName.length === 0 || sanitizedCode.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid 'name' or 'code' format after sanitization."
                    });
                }

                const codes = readCodes();
                codes[sanitizedName] = sanitizedCode;

                if (writeCodes(codes)) {
                    executeCommand(`echo "✅ Saved button '${sanitizedName}' successfully!"`, res);
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

                // **SECURITY FIX**: Use single quotes inside the shell command to treat the code as a literal string.
                const command = `su -c "echo '${rawCode}' > /sys/class/remote/transmit"`;
                
                const pre_command = `echo "🚀 Transmitting code for '${name}'..."`;
                executeCommand(`${pre_command} && ${command}`, res);
            }
        },
        delete: {
            description: 'Deletes a saved IR code. Param: ?name=my_button_name',
            execute: (req, res, executeCommand) => {
                const { name } = req.query;
                if (!name) {
                    return res.status(400).json({ success: false, message: "Missing 'name' query parameter." });
                }

                const codes = readCodes();
                if (!codes[name]) {
                    return res.status(404).json({ success: false, message: `Button '${name}' not found.` });
                }

                delete codes[name];

                if (writeCodes(codes)) {
                    executeCommand(`echo "✅ Deleted button '${name}' successfully!"`, res);
                } else {
                    res.status(500).json({
                        success: false,
                        message: "Failed to update ir_codes.json on the server."
                    });
                }
            }
        }
    }
};

