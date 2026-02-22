export const monitoringService = {
    warningCount: 0,
    maxWarnings: 3,
    listeners: {},

    isPaused: false,

    pause() {
        this.isPaused = true;
    },

    resume() {
        this.isPaused = false;
    },

    init(onViolation, maxWarnings = 3) {
        this.maxWarnings = maxWarnings;
        this.warningCount = 0;
        this.isPaused = false;

        // Fullscreen Enforcement
        this.listeners.fullscreen = () => {
            if (this.isPaused) return;
            if (!document.fullscreenElement) {
                this.handleViolation('fullscreen_exit', 'Exited fullscreen mode', onViolation);
            }
        };
        document.addEventListener('fullscreenchange', this.listeners.fullscreen);

        // Tab Switching / Visibility Change
        this.listeners.visibility = () => {
            if (this.isPaused) return;
            if (document.hidden) {
                this.handleViolation('tab_switch', 'Switched tabs or minimized window', onViolation);
            }
        };
        document.addEventListener('visibilitychange', this.listeners.visibility);

        // Window Blur (Alternative to visibility)
        this.listeners.blur = () => {
            if (this.isPaused) return;
            this.handleViolation('tab_switch', 'Window lost focus', onViolation);
        };
        window.addEventListener('blur', this.listeners.blur);

        // Copy/Paste Prevention (Optional - just logging for now)
        this.listeners.copy = (e) => {
            // e.preventDefault(); // Uncomment to block
            this.handleViolation('copy_paste', 'Attempted to copy content', onViolation, false);
        };
        document.addEventListener('copy', this.listeners.copy);
    },

    cleanup() {
        document.removeEventListener('fullscreenchange', this.listeners.fullscreen);
        document.removeEventListener('visibilitychange', this.listeners.visibility);
        window.removeEventListener('blur', this.listeners.blur);
        document.removeEventListener('copy', this.listeners.copy);
    },

    handleViolation(type, message, callback, incrementWarning = true) {
        if (incrementWarning) {
            this.warningCount++;
        }

        const timestamp = new Date();
        console.warn(`[Monitoring] Violation: ${type} - ${message}`);

        if (callback) {
            callback({
                type,
                message,
                count: this.warningCount,
                timestamp
            });
        }
    },

    requestFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    }
};
