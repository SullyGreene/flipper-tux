// File: flipper-tux/routes/modules.js
/**
 * @file TUX Modules Router
 * @description This is the base router where all dynamic drop-in modules are mounted by server.js.
 */
const express = require('express');
const router = express.Router();

// The main server.js file will dynamically add routes from the /tux directory to this router.
// For example, a module defined in 'tux/example.js' with a '/ping' route
// will be accessible at '/api/modules/example/ping'.

router.get('/', (req, res) => {
    res.json({
        message: "This is the base endpoint for TUX Modules.",
        description: "See /api/server-info for a list of all loaded modules and their specific routes."
    });
});

module.exports = router;

