// UI related functionality

/**
 * Initialize tab switching
 */
export function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Show selected tab content
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // Handle special cases when switching tabs
            if (tabId === 'editor') {
                import('./editor.js').then(module => {
                    if (!module.isInitialized()) {
                        module.initialize();
                    }
                    // Ensure editor layout is correct
                    if (module.getEditorInstance()) {
                        module.getEditorInstance().layout();
                    }
                });
            }
        });
    });
}

/**
 * Show a notification to the user
 */
export function showNotification(message, type = 'info') {
    // You could create a small notification system here
    console.log(`[${type}] ${message}`);
}