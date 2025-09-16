document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button[data-api]');
    const outputLog = document.getElementById('output-log');

    // Display a loading message in the log
    const showLoading = (endpoint) => {
        outputLog.style.color = '#888';
        outputLog.textContent = `⏳ Requesting ${endpoint}...`;
    };

    // Display the result from the API call
    const showResult = (data) => {
        if (data.success) {
            outputLog.style.color = '#4ade80'; // Green for success
            // Format JSON nicely if the output is an object
            const outputText = typeof data.output === 'object' ? JSON.stringify(data.output, null, 2) : data.output;
            outputLog.textContent = `✅ Success!\n\n${outputText || '(No output)'}`;
        } else {
            outputLog.style.color = '#f87171'; // Red for error
            outputLog.textContent = `❌ Error!\n\n${data.message}\n${data.stderr || ''}`;
        }
    };
    
    // Display a fetch error
    const showError = (error) => {
        outputLog.style.color = '#f87171';
        outputLog.textContent = `❌ Network Error!\n\nCould not connect to the server. Is it running?\n${error.message}`;
    }

    // Add click listener to all API buttons
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const endpoint = button.getAttribute('data-api');
            showLoading(endpoint);

            try {
                const response = await fetch(endpoint);
                const result = await response.json();
                showResult(result);
            } catch (error) {
                console.error('Fetch error:', error);
                showError(error);
            }
        });
    });
});
