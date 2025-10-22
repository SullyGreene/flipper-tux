/**
 * File: flipper-tux/public/js/main.js
 * Flipper TUX - Frontend Logic
 * Handles device discovery, PIN authentication, API calls, and UI state management.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const appState = {
        currentView: 'discovery', // 'discovery', 'pin', 'control-panel'
        discoveredDevices: [], // { name, ip }
        connectedDevice: null, // { name, ip }
        devicePin: null,
    };

    // --- ELEMENT SELECTORS ---
    const views = {
        discovery: document.getElementById('discovery-view'),
        pin: document.getElementById('pin-view'),
        controlPanel: document.getElementById('control-panel-view'),
    };
    const deviceList = document.getElementById('device-list');
    const discoveryStatus = document.getElementById('discovery-status');
    const pinDeviceName = document.getElementById('pin-device-name');
    const pinInputs = document.querySelectorAll('.pin-input');
    const pinError = document.getElementById('pin-error');
    const pinCancelBtn = document.getElementById('pin-cancel-btn');
    const pinSubmitBtn = document.getElementById('pin-submit-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const logOutput = document.getElementById('log-output');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const apiStatusDot = document.querySelector('#api-status .status-dot');
    const connectedDeviceName = document.getElementById('connected-device-name');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalText = document.getElementById('modal-text');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    let modalResolve = null;

    // --- VIEW SWITCHING LOGIC ---
    const switchView = (viewName) => {
        appState.currentView = viewName;
        Object.keys(views).forEach(key => {
            views[key].classList.toggle('hidden', key !== viewName);
        });
        if (viewName === 'pin') {
            pinInputs[0].focus();
        }
    };

    // --- LOGGING UTILITY ---
    const log = (message, type = 'info') => {
        if (!logOutput) return;
        const timestamp = new Date().toLocaleTimeString();
        const emojiMap = { info: 'ℹ️', success: '✅', error: '❌', command: '▶️', response: '◀️' };
        const colorClass = { info: 'text-gray-400', success: 'text-green-400', error: 'text-red-400', command: 'text-yellow-400', response: 'text-cyan-400' };
        logOutput.innerHTML += `<span class="${colorClass[type]}">[${timestamp}] ${emojiMap[type]} ${message}\n</span>`;
        logOutput.scrollTop = logOutput.scrollHeight;
    };

    // --- DEVICE DISCOVERY ---
    const discoverDevices = async () => {
        // This is a simplified discovery for common home networks (192.168.1.x)
        // A more robust solution might use UDP broadcasts or mDNS.
        const commonSubnets = [
            "192.168.1.", // Common for many routers
            "192.168.0.", // Also common
            "10.0.0.",    // Common for some ISPs (e.g., Xfinity)
            "172.16.0."   // Less common, but part of private IP ranges
        ];
        const promises = [];
        const discoveryPort = 3691; // Standardized port for Flipper TUX
        
        log('Scanning for devices on your local network...', 'info');
        discoveryStatus.textContent = 'Scanning... This may take a moment.';

        commonSubnets.forEach(subnet => {
            for (let i = 1; i < 255; i++) {
                const ip = subnet + i;
                const promise = fetch(`http://${ip}:${discoveryPort}/api/discover`, { signal: AbortSignal.timeout(1000) })
                    .then(response => response.ok ? response.json() : Promise.reject())
                    .then(data => ({ name: data.deviceName, ip }))
                    .catch(() => null);
                promises.push(promise);
            }
        });

        const results = await Promise.all(promises);
        appState.discoveredDevices = results.filter(Boolean);
        renderDeviceList();
    };

    const renderDeviceList = () => {
        deviceList.innerHTML = '';
        if (appState.discoveredDevices.length > 0) {
            appState.discoveredDevices.forEach(device => {
                const deviceElement = document.createElement('button');
                deviceElement.className = 'w-full text-left p-4 bg-gray-700 hover:bg-cyan-800 rounded-md transition-colors';
                deviceElement.innerHTML = `<strong class="text-cyan-400">${device.name}</strong><br><span class="text-xs text-gray-400">${device.ip}</span>`;
                deviceElement.onclick = () => {
                    appState.connectedDevice = device;
                    pinDeviceName.textContent = device.name;
                    pinError.textContent = '';
                    pinInputs.forEach(input => input.value = '');
                    switchView('pin');
                };
                deviceList.appendChild(deviceElement);
            });
        } else {
            discoveryStatus.textContent = 'No Flipper TUX devices found. Is your device on the same Wi-Fi network?';
            deviceList.appendChild(discoveryStatus);
        }
    };
    
    // --- PIN AUTHENTICATION ---
    const handlePinSubmit = () => {
        let pin = "";
        pinInputs.forEach(input => pin += input.value);
        if (pin.length === 4) {
            appState.devicePin = pin;
            connectToDevice();
        } else {
            pinError.textContent = 'Please enter a 4-digit PIN.';
        }
    };
    
    const connectToDevice = async () => {
        pinError.textContent = 'Authenticating...';
        pinSubmitBtn.disabled = true;
        
        // Use /api/server-info as the authentication test
        const result = await apiCall('/api/server-info'); 
        
        pinSubmitBtn.disabled = false;
        
        if (result) {
            sessionStorage.setItem('flipper-tux-device', JSON.stringify(appState.connectedDevice));
            sessionStorage.setItem('flipper-tux-pin', appState.devicePin);
            initializeAppUI(result);
            switchView('control-panel');
        } else {
            pinError.textContent = 'Authentication failed. Invalid PIN.';
            pinInputs.forEach(input => input.value = '');
            pinInputs[0].focus();
        }
    };

    // --- API CALLS ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        if (!appState.connectedDevice || !appState.devicePin) {
            log('Cannot make API call: Not connected or authenticated.', 'error');
            return null;
        }
        
        log(`Executing: ${method} ${endpoint}`, 'command');
        const button = document.querySelector(`[data-api="${endpoint}"]`);
        if (button) button.classList.add('loading');
        
        const { ip } = appState.connectedDevice;
        const headers = { 'X-Device-PIN': appState.devicePin }; // Ensure this is correctly passed
        const options = { method, headers };

        if (body) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        
        try { // Use the hardcoded discoveryPort for API calls
            const response = await fetch(`http://${ip}:3691${endpoint}`, options);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `HTTP error! Status: ${response.status}`);

            log(`Success from ${endpoint}`, 'success');
            const output = typeof result.output === 'object' ? JSON.stringify(result.output, null, 2) : result.output;
            if(output) log(output, 'response');
            return result;
        } catch (error) {
            log(`Error calling ${endpoint}: ${error.message}`, 'error');
            return null;
        } finally {
            if (button) button.classList.remove('loading');
        }
    };

    // --- MODAL HANDLING ---
    const showConfirmation = (message) => {
        return new Promise((resolve) => {
            modalText.textContent = message;
            confirmationModal.classList.remove('hidden');
            modalResolve = resolve;
        });
    };

    // --- CONTROL PANEL INITIALIZATION ---
    const initializeAppUI = (serverInfo) => {
        log('Initializing Flipper TUX UI...');
        connectedDeviceName.textContent = `Connected to: ${serverInfo.deviceName}`;
        apiStatusDot.classList.replace('bg-yellow-500', 'bg-green-500');
        updateDeviceStatus();
        loadDynamicModules(serverInfo.modules);
        log('UI Ready.', 'success');
    };
    
    const updateDeviceStatus = async () => {
        document.getElementById('status-hostname').textContent = appState.connectedDevice.name;
        const batteryData = await apiCall('/api/termux/battery');
        if (batteryData?.output) {
             try {
                const status = typeof batteryData.output === 'string' ? JSON.parse(batteryData.output) : batteryData.output;
                document.getElementById('status-battery').textContent = `${status.percentage}% (${status.status})`;
             } catch(e) { 
                document.getElementById('status-battery').textContent = 'N/A';
             }
        }
    };
    
    const loadDynamicModules = (modules) => {
         const container = document.getElementById('dynamic-modules-container');
         container.innerHTML = '';
         if (!modules || modules.length === 0) return;

         const card = document.createElement('section');
         card.className = 'control-card bg-gray-800/80 border-cyan-500/50 border';
         card.innerHTML = `<h2 class="card-title text-cyan-400">TUX Modules</h2>`;
         const grid = document.createElement('div');
         grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
         
         modules.forEach(module => {
             module.routes.forEach(route => {
                 const btn = document.createElement('button');
                 btn.className = 'btn btn-info';
                 btn.dataset.api = route.path;
                 btn.dataset.method = route.method;
                 btn.textContent = route.path.split('/').pop().replace(/-/g, ' ');
                 grid.appendChild(btn);
             });
         });
         card.appendChild(grid);
         container.appendChild(card);
    };

    // --- EVENT LISTENERS ---
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
    
    pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if(index < 3) pinInputs[index + 1].focus();
            } else if (e.key === 'Backspace') {
                if(index > 0) pinInputs[index - 1].focus();
            }
        });
         input.addEventListener('input', () => {
            if (input.value && index < 3) {
                pinInputs[index + 1].focus();
            }
        });
    });

    pinSubmitBtn.addEventListener('click', handlePinSubmit);
    pinCancelBtn.addEventListener('click', () => switchView('discovery'));
    clearLogBtn.addEventListener('click', () => { logOutput.innerHTML = ''; log('Log cleared.'); });
    disconnectBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.reload();
    });
    modalConfirm.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        if (modalResolve) modalResolve(true);
    });
    modalCancel.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        if (modalResolve) modalResolve(false);
    });

    // --- APP START ---
    const checkSession = () => {
        const storedDevice = sessionStorage.getItem('flipper-tux-device');
        const storedPin = sessionStorage.getItem('flipper-tux-pin');
        if (storedDevice && storedPin) {
            appState.connectedDevice = JSON.parse(storedDevice);
            appState.devicePin = storedPin;
            connectToDevice(); // Try to reconnect to the previous session
        } else {
            discoverDevices();
            switchView('discovery');
        }
    };

    checkSession();
});
