/**
 * ToastManager - Handles toast notifications
 */
class ToastManager {
    constructor() {
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for toast notifications
     */
    setupEventListeners() {
        document.addEventListener('crossword:toast', (e) => {
            const { message, type = 'info', duration = 3000 } = e.detail;
            this.show(message, type, duration);
        });
    }

    /**
     * Displays a toast notification message to the user
     * @param {string} message - The message to display
     * @param {string} [type='info'] - The type of toast (info, success, error)
     * @param {number} [duration=3000] - How long to show the toast in milliseconds
     */
    show(message, type = 'info', duration = 3000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide and remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Utility function to save file (compatible with FileSaver.js or fallback)
function saveAs(blob, filename) {
    // Try to use FileSaver.js if available (it might be loaded after this script)
    if (typeof window.saveAs === 'function' && window.saveAs !== saveAs) {
        try {
            window.saveAs(blob, filename);
            return;
        } catch (e) {
            // FileSaver.js failed, using fallback
        }
    }
    
    // Fallback implementation
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        // Dispatch toast event to show error
        document.dispatchEvent(new CustomEvent('crossword:toast', {
            detail: { message: 'Download failed. Please try again.', type: 'error' }
        }));
    }
}
