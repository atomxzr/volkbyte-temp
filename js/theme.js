// Theme Toggle — light/dark switching with localStorage persistence
(function () {
    const STORAGE_KEY = 'volkbyte-theme';
    const root = document.documentElement;

    // Restore saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light') {
        root.classList.add('light-theme');
    }

    // Wire up the toggle button
    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const isLight = root.classList.toggle('light-theme');
            localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
        });
    });
})();
