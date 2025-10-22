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
// Read host from environment variable, default to localhost for security (P3: Default Server to Localhost Binding)
const HOST = process.env.HOST || '127.0.0.1';
// Read device identity from .env file, with sensible defaults
const DEVICE_NAME = process.env.DEVICE_NAME || os.hostname();
const DEVICE_PIN = process.env.DEVICE_PIN || null;

// P3: Implement --readonly Mode
const IS_READONLY = process.argv.includes('--readonly');

// --- Audit Logger ---
const auditLogStream = fs.createWriteStream(path.join(__dirname, 'audit.log'), { flags: 'a' });
const logAuditEvent = (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    console.log(logMessage.trim()); // Also log to console
    auditLogStream.write(logMessage);
};

logAuditEvent('info', `Server starting for device '${DEVICE_NAME}' on ${HOST}:${PORT}...`);

if (IS_READONLY) {
    logAuditEvent('warn', '--- READ-ONLY MODE ENABLED --- All state-changing API requests and /api/root/* routes will be blocked.');
}

if (!DEVICE_PIN) {
    const warning = "No DEVICE_PIN found in .env. API is UNPROTECTED. Run installation.sh to set a PIN.";
    logAuditEvent('warn', `--- SECURITY WARNING --- ${warning}`);
}

// --- Middleware ---
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)
app.set('trust proxy', true); // Required to get the real IP address if behind a proxy

// P3: Read-Only Middleware
const readOnlyMiddleware = (req, res, next) => {
    if (IS_READONLY) {
        const isRootApi = req.originalUrl.startsWith('/api/root');
        const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

        if (isRootApi || isStateChangingMethod) {
            logAuditEvent('warn', `[READONLY] Denied access for IP ${req.ip} to ${req.method} ${req.originalUrl}. Reason: Read-only mode is enabled.`);
            return res.status(403).json({ error: 'Forbidden: Server is in read-only mode.' });
        }
    }
    next();
};

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
    logAuditEvent('warn', `[AUTH] Denied access for IP ${req.ip} to ${req.method} ${req.originalUrl}. Reason: Incorrect or missing PIN.`);
    res.status(401).json({ error: 'Authentication required. Provide a valid PIN in the X-Device-PIN header.' });
};

// --- Request Logging Middleware ---
// This logs all authenticated API requests.
const requestLogger = (req, res, next) => {
    // This middleware will be placed after auth, so we only log authenticated requests.
    res.on('finish', () => {
        // We log on 'finish' to include the status code.
        logAuditEvent('info', `[API] ${req.ip} - "${req.method} ${req.originalUrl}" ${res.statusCode}`);
    });
    next();
};

// --- API Routers ---
const termuxRouter = require('./routes/termux');
const rootRouter = require('./routes/root');
const moduleRouter = require('./routes/modules');

// Apply the authentication middleware to all routes that control the device
app.use('/api/termux', readOnlyMiddleware, authMiddleware, requestLogger, termuxRouter);
app.use('/api/root', readOnlyMiddleware, authMiddleware, requestLogger, rootRouter);
app.use('/api/modules', readOnlyMiddleware, authMiddleware, requestLogger, moduleRouter);
logAuditEvent('info', 'API routers mounted with authentication and logging.');


// --- Dynamic Module Loading ---
const modulesDir = path.join(__dirname, 'tux');
if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(file => file.endsWith('.js'));
    logAuditEvent('info', `Found ${moduleFiles.length} custom TUX module(s).`);

    moduleFiles.forEach(file => {
        try {
            const modulePath = path.join(modulesDir, file);
            const module = require(modulePath);
            const moduleName = path.basename(file, '.js');
            
            if (module && module.router && module.name) {
                // The module's router is mounted under the main auth/logger chain.
                moduleRouter.use(`/${moduleName}`, module.router);
                logAuditEvent('info', `Loaded module '${module.name}' at /api/modules/${moduleName}`);
            } else {
                logAuditEvent('warn', `Skipping invalid module file (missing name or router): ${file}`);
            }
        } catch (error) {
            logAuditEvent('error', `Error loading module ${file}: ${error.message}`);
        }
    });
} else {
    logAuditEvent('info', 'No "tux" directory found, skipping custom module loading.');
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
app.get('/api/server-info', readOnlyMiddleware, authMiddleware, requestLogger, (req, res) => {
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
app.listen(PORT, HOST, () => { // P3: Default Server to Localhost Binding
    logAuditEvent('info', '--- Flipper TUX Server is live! ---');
    logAuditEvent('info', `Device Name: ${DEVICE_NAME}`);
    logAuditEvent('info', `Access the UI from any device on your local network.`);
    
    const networkInterfaces = os.networkInterfaces();
    const displayPort = PORT == 80 || PORT == 443 ? '' : `:${PORT}`;

    logAuditEvent('info', '--- Network Access ---');
    Object.keys(networkInterfaces).forEach(ifaceName => {
        const addresses = networkInterfaces[ifaceName];
        if (addresses) {
            addresses.forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    // Only log if the server is binding to 0.0.0.0 or the specific interface IP
                    if (HOST === '0.0.0.0' || HOST === iface.address) {
                        logAuditEvent('info', `  - ${ifaceName}: http://${iface.address}${displayPort}`);
                    }
                }
            });
        }
    });
    logAuditEvent('info', `  - Localhost: http://127.0.0.1${displayPort}`);
    // Only log custom URL if binding to 0.0.0.0 or 127.0.0.1 (as flipper.tux resolves to 127.0.0.1)
    if (HOST === '0.0.0.0' || HOST === '127.0.0.1') {
        logAuditEvent('info', `  - Custom URL: http://flipper.tux${displayPort}`);
    }
    logAuditEvent('info', '-------------------------------------');
});
