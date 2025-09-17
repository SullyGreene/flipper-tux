// File: flipper-tux/tux/infrared.js
/**
 * @file Real Infrared Remote Module
 * @description Scans, saves, and transmits real IR codes using a rooted device's hardware.
 * @warning This is hardware-dependent. The file paths used may need to be changed for your device.
 */
const fs = require('fs');
const path = require('path');

// **UPGRADED**: The path now points to a central database directory.
const dbDirectory = path.join(__dirname, '..', 'database');
const codesDbPath = path.join(dbDirectory, 'ir_codes.json');

// --- Helper Functions ---
const readCodes = () => {
    try {
        if (fs.existsSync(codesDbPath)) {
            const data = fs.readFileSync(codesDbPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("❌ Error reading ir_codes.json:", err);
    }
    return {}; // Return empty object if file doesn't exist or is invalid
};

const writeCodes = (codes) => {
    try {
        // **UPGRADE**: Ensure the database directory exists before writing.
        if (!fs.existsSync(dbDirectory)) {
            fs.mkdirSync(dbDirectory, { recursive: true });
            console.log(`[infrared] Created database directory at: ${dbDirectory}`);
        }
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
            description: 'Lists all saved remote control buttons from the database.',
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
                        echo "✅ Signal captured! Raw Code (use this for the 'save' command):";
                        echo "$RAW_CODE";
                    fi
                `;
                executeCommand(command, res, { timeout: 12000 });
            }
        },
        save: {
            description: 'Saves a captured IR code. Params: ?name=my_button&code=RAW_CODE',
            execute: (req, res, executeCommand) => {
                let { name, code } = req.query;
                if (!name || !code) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing 'name' or 'code' query parameter."
                    });
                }
                const sanitizedName = name.replace(/[^a-zA-Z0-9_\-]/g, '');
                const sanitizedCode = code.replace(/[^0-9\s]/g, '').trim();
                if (sanitizedName.length === 0 || sanitizedCode.length === 0) {
                    return res.status(400).json({ success: false, message: "Invalid 'name' or 'code'." });
                }
                const codes = readCodes();
                codes[sanitizedName] = sanitizedCode;
                if (writeCodes(codes)) {
                    executeCommand(`echo "✅ Saved button '${sanitizedName}' successfully!"`, res);
                } else {
                    res.status(500).json({ success: false, message: "Failed to write code to database." });
                }
            }
        },
        send: {
            description: 'Transmits a saved IR code. Param: ?name=my_button',
            execute: (req, res, executeCommand) => {
                const { name } = req.query;
                if (!name) {
                    return res.status(400).json({ success: false, message: "Missing 'name' query parameter." });
                }
                const codes = readCodes();
                const rawCode = codes[name];
                if (!rawCode) {
                    return res.status(404).json({ success: false, message: `Button '${name}' not found.` });
                }
                const command = `su -c "echo '${rawCode}' > /sys/class/remote/transmit"`;
                executeCommand(`echo "🚀 Transmitting '${name}'..." && ${command}`, res);
            }
        },
        delete: {
            description: 'Deletes a saved IR code. Param: ?name=my_button',
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
                    res.status(500).json({ success: false, message: "Failed to update database." });
                }
            }
        },
        rename: {
            description: 'Renames a saved IR code. Params: ?oldName=button_a&newName=button_b',
            execute: (req, res, executeCommand) => {
                const { oldName, newName } = req.query;
                if (!oldName || !newName) {
                    return res.status(400).json({ success: false, message: "Missing 'oldName' or 'newName' parameter." });
                }
                const codes = readCodes();
                if (!codes[oldName]) {
                    return res.status(404).json({ success: false, message: `Button '${oldName}' not found.` });
                }
                const sanitizedNewName = newName.replace(/[^a-zA-Z0-9_\-]/g, '');
                if (sanitizedNewName.length === 0) {
                    return res.status(400).json({ success: false, message: "Invalid 'newName'." });
                }
                codes[sanitizedNewName] = codes[oldName];
                delete codes[oldName];
                if (writeCodes(codes)) {
                    executeCommand(`echo "✅ Renamed '${oldName}' to '${sanitizedNewName}' successfully!"`, res);
                } else {
                    res.status(500).json({ success: false, message: "Failed to update database." });
                }
            }
        }
    }
};

