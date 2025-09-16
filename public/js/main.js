/**
 * Flipper TUX - Frontend Logic
 * Handles API calls, UI updates, and dynamic module loading.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    const API_BASE = ''; // API is on the same origin
    const logOutput = document.getElementById('log-output');
    const apiStatusDot = document.querySelector('#api-status .status-dot');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const modal = document.getElementById('confirmation-modal');
    const modalText = document.getElementById('modal-text');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    let modalResolve = null;

    // --- LOGGING ---
    const log = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const emojiMap = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            command: '▶️',
            response: '◀️'
        };
        const emoji = emojiMap[type] || ' ';

        const colorClass = {
            info: 'text-gray-400',
            success: 'text-green-400',
            error: 'text-red-400',
            command: 'text-yellow-400',
            response: 'text-cyan-400'
        }[type];
        logOutput.innerHTML += `<span class="${colorClass}">[${timestamp}] ${emoji} ${message}\n</span>`;
        logOutput.scrollTop = logOutput.scrollHeight;
    };

    const clearLog = () => {
        logOutput.innerHTML = '';
        log('Log cleared.', 'info');
    };

    // --- API CALLS ---
    const apiCall = async (endpoint, method = 'GET') => {
        log(`Executing: ${method} ${endpoint}`, 'command');
        const button = document.querySelector(`[data-api="${endpoint}"]`);
        if (button) button.classList.add('loading');

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, { method });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! Status: ${response.status}`);
            }

            log(`Success from ${endpoint}`, 'success');
            // Pretty-print JSON objects
            const output = typeof result.output === 'object' 
                ? JSON.stringify(result.output, null, 2) 
                : result.output;
            log(output, 'response');
            return result;
        } catch (error) {
            log(`Error calling ${endpoint}: ${error.message}`, 'error');
            return null; // Return null on failure
        } finally {
            if (button) button.classList.remove('loading');
        }
    };

    // --- MODAL HANDLING ---
    const showConfirmation = (message) => {
        return new Promise((resolve) => {
            modalText.textContent = message;
            modal.classList.remove('hidden');
            modalResolve = resolve;
        });
    };

    const handleModalConfirm = () => {
        modal.classList.add('hidden');
        if (modalResolve) modalResolve(true);
    };

    const handleModalCancel = () => {
        modal.classList.add('hidden');
        if (modalResolve) modalResolve(false);
    };

    // --- UI INITIALIZATION ---
    const checkApiStatus = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/test`);
            if (!response.ok) throw new Error('Server not reachable');
            apiStatusDot.classList.replace('bg-yellow-500', 'bg-green-500');
            log('API connection successful.', 'success');
        } catch (error) {
            apiStatusDot.classList.replace('bg-yellow-500', 'bg-red-500');
            log('API connection failed. Is the server running?', 'error');
        }
    };
    
    const updateDeviceStatus = async () => {
        const batteryData = await apiCall('/api/termux/battery');
        if (batteryData && batteryData.output) {
            try {
                const status = JSON.parse(batteryData.output);
                document.getElementById('status-battery').textContent = `${status.percentage}% (${status.status})`;
            } catch (e) {
                document.getElementById('status-battery').textContent = 'N/A';
            }
        }
        // A simple 'hostname' command can get the device name
        const hostnameData = await apiCall('/api/termux/exec?cmd=hostname');
        if(hostnameData && hostnameData.output) {
             document.getElementById('status-hostname').textContent = hostnameData.output;
        }
    };

    const loadDynamicModules = async () => {
        const container = document.getElementById('dynamic-modules-container');
        try {
            const response = await fetch(`${API_BASE}/api/server-info`);
            const data = await response.json();

            if (!data.modules || data.modules.length === 0) {
                log('No custom TUX modules found.', 'info');
                return;
            }

            log(`Found ${data.modules.length} TUX module(s).`, 'info');
            
            const moduleCard = document.createElement('section');
            moduleCard.className = 'control-card bg-gray-800/80 border-cyan-500/50 border';
            moduleCard.innerHTML = `<h2 class="card-title text-cyan-400">TUX Modules</h2>`;
            
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

            data.modules.forEach(module => {
                module.routes.forEach(route => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-info';
                    btn.dataset.api = route.path;
                    btn.dataset.method = route.method;
                    // Extract a readable name from the path
                    btn.textContent = route.path.split('/').pop().replace(/-/g, ' ');
                    grid.appendChild(btn);
                });
            });

            moduleCard.appendChild(grid);
            container.appendChild(moduleCard);

        } catch (error) {
            log('Failed to load dynamic modules.', 'error');
        }
    };

    const attachEventListeners = () => {
        document.body.addEventListener('click', async (e) => {
            if (e.target.matches('.btn[data-api]')) {
                const button = e.target;
                const endpoint = button.dataset.api;
                const method = button.dataset.method || 'GET';
                const confirmationMessage = button.dataset.confirm;

                if (confirmationMessage) {
                    const confirmed = await showConfirmation(confirmationMessage);
                    if (!confirmed) {
                        log('Operation cancelled by user.', 'info');
                        return;
                    }
                }
                apiCall(endpoint, method);
            }
        });

        clearLogBtn.addEventListener('click', clearLog);
        modalConfirm.addEventListener('click', handleModalConfirm);
        modalCancel.addEventListener('click', handleModalCancel);
    };

    // --- MAIN EXECUTION ---
    const initializeApp = async () => {
        log('Initializing Flipper TUX UI...');
        await checkApiStatus();
        await updateDeviceStatus();
        await loadDynamicModules();
        attachEventListeners();
        log('UI Ready.', 'success');
    };

    initializeApp();
});

