/**
 * @file Flipper TUX - Main Server
 * @description A Node.js Express server to control a rooted Android device via a web UI.
 */

// --- Core Dependencies ---
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- Server Initialization ---
const app = express();
// Read port from environment variable set by start.sh, default to 3000
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// --- Helper Function for executing commands ---
// A centralized place to log and execute shell commands.
const executeCommand = (command, res) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({ command, error: stderr || error.message });
        }
        res.json({ command, output: stdout.trim() });
    });
};

// --- API Routers ---
const termuxRouter = require('./routes/termux');
const rootRouter = require('./routes/root');
const moduleRouter = require('./routes/modules'); // For drop-in modules

app.use('/api/termux', termuxRouter);
app.use('/api/root', rootRouter);
app.use('/api/modules', moduleRouter);

// --- Dynamic Module Loading ---
const modulesDir = path.join(__dirname, 'tux');
if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(file => file.endsWith('.js'));
    console.log(`Found ${moduleFiles.length} custom modules.`);

    moduleFiles.forEach(file => {
        try {
            const module = require(path.join(modulesDir, file));
            const moduleName = path.basename(file, '.js');
            if (module && module.router && module.name) {
                app.use(`/api/modules/${moduleName}`, module.router);
                console.log(`  - Loaded module '${module.name}' at /api/modules/${moduleName}`);
            }
        } catch (error) {
            console.error(`Error loading module ${file}:`, error);
        }
    });
}


// --- API Endpoints ---

// Simple test endpoint to confirm the server is running
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Flipper TUX server is running!' });
});

// Endpoint to get server info (useful for UI)
app.get('/api/server-info', (req, res) => {
    // Dynamically get module info
    const loadedModules = [];
    if (fs.existsSync(modulesDir)) {
        const moduleFiles = fs.readdirSync(modulesDir).filter(file => file.endsWith('.js'));
        moduleFiles.forEach(file => {
            try {
                const module = require(path.join(modulesDir, file));
                const moduleName = path.basename(file, '.js');
                if (module && module.name) {
                    // Get the routes from the router stack
                    const routes = module.router.stack.map(layer => ({
                        path: `/api/modules/${moduleName}${layer.route.path}`,
                        method: Object.keys(layer.route.methods)[0].toUpperCase()
                    }));
                    loadedModules.push({
                        name: module.name,
                        description: module.description,
                        basePath: moduleName,
                        routes: routes
                    });
                }
            } catch (error) {
                // Ignore failed loads
            }
        });
    }

    res.json({
        message: "Welcome to Flipper TUX!",
        modules: loadedModules
    });
});


// --- Server Startup ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🐧 Flipper TUX Server is live!`);
    console.log(`Access the UI from any device on your network.`);
    
    // Find and display local IP addresses for easy access
    const networkInterfaces = os.networkInterfaces();
    console.log('\n--- Network Access ---');
    Object.keys(networkInterfaces).forEach(ifaceName => {
        networkInterfaces[ifaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  - ${ifaceName}: http://${iface.address}:${PORT}`);
            }
        });
    });
    console.log(`  - Localhost: http://127.0.0.1:${PORT}`);
    console.log('----------------------');
});

// --- Create Routers (to keep main file clean) ---

// routes/termux.js
const termuxApiRouter = express.Router();
termuxApiRouter.get('/battery', (req, res) => executeCommand('termux-battery-status', res));
termuxApiRouter.get('/vibrate', (req, res) => executeCommand('termux-vibrate -d 500', res));
termuxApiRouter.get('/flashlight/:state', (req, res) => {
    const state = req.params.state === 'on' ? 'on' : 'off';
    executeCommand(`termux-torch ${state}`, res);
});
termuxApiRouter.get('/device-info', (req, res) => executeCommand('termux-device-info', res));
termuxApiRouter.get('/contact-list', (req, res) => executeCommand('termux-contact-list', res));
fs.writeFileSync('./routes/termux.js', `const express = require('express');\nconst { exec } = require('child_process');\nconst router = express.Router();\n\nconst executeCommand = (command, res) => { console.log('Executing:', command); exec(command, (error, stdout, stderr) => { if (error) { console.error('Exec Error:', error); return res.status(500).json({ command, error: stderr || error.message }); } res.json({ command, output: stdout.trim() }); }); };\n\n${termuxApiRouter.stack.map(r => `router.get('${r.route.path}', (req, res) => { ${r.route.stack[0].handle.toString().replace(/executeCommand/g, "executeCommand(req, res)")} });`).join('\n')}\n\nmodule.exports = router;`);


// routes/root.js
const rootApiRouter = express.Router();
rootApiRouter.get('/whoami', (req, res) => executeCommand("su -c 'whoami'", res));
rootApiRouter.get('/reboot', (req, res) => executeCommand("su -c 'reboot'", res));
rootApiRouter.get('/wifi/scan', (req, res) => executeCommand("su -c 'iw dev wlan0 scan'", res));
rootApiRouter.get('/wifi/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc wifi ${state}'`, res);
});
rootApiRouter.get('/bluetooth/scan', (req, res) => executeCommand("su -c 'bluetoothctl scan on'", res));
rootApiRouter.get('/nfc/:state', (req, res) => {
    const state = req.params.state === 'enable' ? 'enable' : 'disable';
    executeCommand(`su -c 'svc nfc ${state}'`, res);
});
fs.writeFileSync('./routes/root.js', `const express = require('express');\nconst { exec } = require('child_process');\nconst router = express.Router();\n\nconst executeCommand = (command, res) => { console.log('Executing:', command); exec(command, (error, stdout, stderr) => { if (error) { console.error('Exec Error:', error); return res.status(500).json({ command, error: stderr || error.message }); } res.json({ command, output: stdout.trim() }); }); };\n\n${rootApiRouter.stack.map(r => `router.get('${r.route.path}', (req, res) => { ${r.route.stack[0].handle.toString().replace(/executeCommand/g, "executeCommand(req, res)")} });`).join('\n')}\n\nmodule.exports = router;`);

// routes/modules.js
fs.writeFileSync('./routes/modules.js', `const express = require('express');\nconst router = express.Router();\n// This is a placeholder for module logic\nmodule.exports = router;`);

