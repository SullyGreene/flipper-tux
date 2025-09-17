/**
 * @file Flipper TUX - Main Server
 * @description A Node.js Express server to control a rooted Android device via a web UI.
 */

// --- Core Dependencies ---
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- Configuration ---
// Load environment variables from .env file
require('dotenv').config();

const app = express();
// Read port from environment variable set by start.sh, default to 3691
const PORT = process.env.PORT || 3691;
// Read device identity from .env file, with sensible defaults
const DEVICE_NAME = process.env.DEVICE_NAME || os.hostname();
const DEVICE_PIN = process.env.DEVICE_PIN || null;

console.log(`[INIT] Starting server for device: '${DEVICE_NAME}' on port ${PORT}...`);

if (!DEVICE_PIN) {
    console.warn("\n--- ⚠️ SECURITY WARNING ---");
    console.warn("No DEVICE_PIN found in the .env file.");
    console.warn("The API is currently UNPROTECTED and accessible to anyone on your network.");
    console.warn("Please run the installation script to set a PIN.\n");
}

// --- Middleware ---
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// --- Authentication Middleware ---
// This checks for the correct PIN on all protected API routes.
const authMiddleware = (req, res, next) => {
    // If no PIN is configured on the server, allow access.
    if (!DEVICE_PIN) {
        return next();
    }
    
    const providedPin = req.headers['x-device-pin'];
    if (providedPin && providedPin === DEVICE_PIN) {
        return next(); // PIN is correct, proceed to the requested route.
    }
    
    // If PIN is incorrect or missing, deny access.
    console.warn(`[AUTH] ❌ Denied access to ${req.path}. Incorrect or missing PIN.`);
    res.status(401).json({ error: 'Authentication required. Provide a valid PIN in the X-Device-PIN header.' });
};


// --- API Routers ---
const termuxRouter = require('./routes/termux');
const rootRouter = require('./routes/root');
const moduleRouter = require('./routes/modules');

// Apply the authentication middleware to all routes that control the device
app.use('/api/termux', authMiddleware, termuxRouter);
app.use('/api/root', authMiddleware, rootRouter);
app.use('/api/modules', authMiddleware, moduleRouter);
console.log('[INIT] API routers mounted with authentication.');


// --- Dynamic Module Loading ---
const modulesDir = path.join(__dirname, 'tux');
if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(file => file.endsWith('.js'));
    console.log(`[INIT] Found ${moduleFiles.length} custom TUX module(s).`);

    moduleFiles.forEach(file => {
        try {
            const modulePath = path.join(modulesDir, file);
            const module = require(modulePath);
            const moduleName = path.basename(file, '.js');
            
            if (module && module.router && module.name) {
                // The module's router is already mounted under auth, so it's protected.
                moduleRouter.use(`/${moduleName}`, module.router);
                console.log(`  - ✅ Loaded module '${module.name}' at /api/modules/${moduleName}`);
            } else {
                console.warn(`  - ⚠️  Skipping invalid module file (missing name or router): ${file}`);
            }
        } catch (error) {
            console.error(`  - ❌ Error loading module ${file}:`, error.message);
        }
    });
} else {
    console.log('[INIT] No "tux" directory found, skipping custom module loading.');
}


// --- Core API Endpoints ---

// Unprotected endpoint for network discovery.
// A future landing page can use this to find all Flipper TUX devices.
app.get('/api/discover', (req, res) => {
    res.json({
        deviceName: DEVICE_NAME,
        message: "Flipper TUX device available."
    });
});

// Simple test endpoint to confirm the server is running (also unprotected).
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Flipper TUX server is running!' });
});

// Protected endpoint to get detailed server and module info for an authenticated UI.
app.get('/api/server-info', authMiddleware, (req, res) => {
    const loadedModules = [];
    if (fs.existsSync(modulesDir)) {
        fs.readdirSync(modulesDir).filter(file => file.endsWith('.js')).forEach(file => {
            try {
                const module = require(path.join(modulesDir, file));
                const moduleName = path.basename(file, '.js');
                if (module && module.name && module.router) {
                    const routes = module.router.stack
                        .filter(layer => layer.route)
                        .map(layer => ({
                            path: `/api/modules/${moduleName}${layer.route.path}`,
                            method: Object.keys(layer.route.methods)[0].toUpperCase(),
                            description: `Executes the '${layer.route.path.slice(1)}' command.`
                        }));
                    
                    loadedModules.push({
                        name: module.name,
                        description: module.description || 'No description provided.',
                        basePath: moduleName,
                        routes: routes
                    });
                }
            } catch (error) { /* Silently ignore failed modules */ }
        });
    }

    res.json({
        message: "Welcome to Flipper TUX!",
        deviceName: DEVICE_NAME,
        modules: loadedModules
    });
});


// --- Server Startup ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n--- 🐧 Flipper TUX Server is live! ---`);
    console.log(`Device Name: ${DEVICE_NAME}`);
    console.log(`Access the UI from any device on your local network.`);
    
    const networkInterfaces = os.networkInterfaces();
    const displayPort = PORT == 80 || PORT == 443 ? '' : `:${PORT}`;

    console.log('\n--- Network Access ---');
    Object.keys(networkInterfaces).forEach(ifaceName => {
        const addresses = networkInterfaces[ifaceName];
        if (addresses) {
            addresses.forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`  - ${ifaceName}: http://${iface.address}${displayPort}`);
                }
            });
        }
    });
    console.log(`  - Localhost: http://127.0.0.1${displayPort}`);
    console.log(`  - Custom URL: http://flipper.tux${displayPort}`);
    console.log('-------------------------------------\n');
});

