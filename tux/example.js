/**
 * @file Flipper TUX Example Module
 * @description This is a sample module to demonstrate how to add new, "drop-in" functionality.
 *
 * To create your own module:
 * 1. Copy this file and rename it (e.g., `my-module.js`). The filename becomes the API path.
 * 2. Change the `name` and `description`.
 * 3. Add your custom commands as new routes on the `router`.
 * 4. The server will automatically load it on next startup.
 */

const { Router } = require('express');
const { exec } = require('child_process');

// 1. DEFINE METADATA
// The name of your module, displayed in the UI.
const name = "Example Module";
// A brief description of what this module does.
const description = "An example module that adds a 'neofetch' command and a simple 'echo' test.";
// Create a new Express router.
const router = Router();


// 2. DEFINE ROUTES
// Each route you define here will become a button in the module's UI card.
// The path you define (e.g., '/neofetch') is automatically appended to your module's base URL.
// Example: This route will be available at GET /api/modules/example/neofetch

/**
 * @route GET /neofetch
 * @description Runs the 'neofetch' command to get system info.
 * This is an example of a command that might require a separate package to be installed (`pkg install neofetch`).
 */
router.get('/neofetch', (req, res) => {
    const command = 'neofetch --stdout';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${name}] exec error: ${error}`);
            // Provide a helpful error if the command isn't found
            if (error.message.includes('not found')) {
                return res.status(500).json({
                    command,
                    error: `Command 'neofetch' not found. Please install it in Termux with 'pkg install neofetch'.`
                });
            }
            return res.status(500).json({ command, error: stderr || error.message });
        }
        res.json({ command, output: stdout });
    });
});

/**
 * @route GET /echo
 * @description A simple test command to demonstrate a non-root operation.
 */
router.get('/echo', (req, res) => {
    const command = 'echo "Hello from the example module!"';
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${name}] exec error: ${error}`);
            return res.status(500).json({ command, error: stderr || error.message });
        }
        res.json({ command, output: stdout });
    });
});


// 3. EXPORT THE MODULE
// The server expects an object with these three properties.
module.exports = {
    name,
    description,
    router
};
