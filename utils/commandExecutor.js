// File: flipper-tux/utils/commandExecutor.js
/**
 * @file Command Executor Utility
 * @description Centralized helper function for executing shell commands and handling responses.
 */
const { exec } = require('child_process');

/**
 * Executes a shell command with a timeout and sends the result as a standardized JSON response.
 *
 * @param {string} command - The shell command to execute.
 * @param {import('express').Response} res - The Express response object.
 * @param {object} [options={}] - Additional options for execution.
 * @param {number} [options.timeout=10000] - The timeout in milliseconds (default: 10 seconds).
 */
const executeCommand = (command, res, options = {}) => {
    const { timeout = 10000 } = options; // Default timeout of 10 seconds

    console.log(`[EXEC] ➡️  Running command: "${command}" (Timeout: ${timeout}ms)`);
    
    const child = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
            // This block is for when the command itself fails or times out
            if (error.signal === 'SIGTERM') {
                 console.error(`[EXEC] ❌ Command timed out: ${command}`);
                 res.status(500).json({
                    success: false,
                    command,
                    message: `Command timed out after ${timeout / 1000} seconds.`,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            } else {
                console.error(`[EXEC] ❌ Error executing command: ${error.message}`);
                res.status(500).json({
                    success: false,
                    command,
                    message: error.message,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            }
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

