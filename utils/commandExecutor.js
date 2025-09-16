// File: flipper-tux/utils/commandExecutor.js
/**
 * @file Command Executor Utility
 * @description Centralized helper function for executing shell commands and handling responses.
 */
const { exec } = require('child_process');

/**
 * Executes a shell command and sends the result as a standardized JSON response.
 * This function handles logging, success cases, and error cases.
 *
 * @param {string} command - The shell command to execute.
 * @param {import('express').Response} res - The Express response object.
 */
const executeCommand = (command, res) => {
    console.log(`[EXEC] ➡️  Running command: "${command}"`);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            // This block is for when the command itself fails to execute
            console.error(`[EXEC] ❌ Error executing command: ${error.message}`);
            res.status(500).json({
                success: false,
                command,
                message: error.message,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            });
            return;
        }

        // Even if the command runs, it might have written to stderr (e.g., warnings)
        if (stderr) {
            console.warn(`[EXEC] ⚠️  Command executed with warnings (stderr): ${stderr.trim()}`);
        }

        console.log(`[EXEC] ✅ Command finished successfully.`);
        // Send a structured success response
        res.json({
            success: true,
            command,
            output: stdout.trim(),
            warnings: stderr.trim() // Include warnings in the success response
        });
    });
};

module.exports = executeCommand;

