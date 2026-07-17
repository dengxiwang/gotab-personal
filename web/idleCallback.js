if (!window.requestIdleCallback) {
    window.requestIdleCallback = function (callback, options) {
        const userTimeout = options?.timeout;
        const startTime = Date.now();
        const fallbackDelay = userTimeout == null
            ? 50
            : Math.min(50, Math.max(0, userTimeout));

        const id = setTimeout(() => {
            const callbackStart = Date.now();
            const didTimeout = userTimeout != null && callbackStart - startTime >= userTimeout;
            callback({
                timeRemaining: () => didTimeout
                    ? 0
                    : Math.max(0, 8 - (Date.now() - callbackStart)),
                didTimeout,
            });
        }, fallbackDelay);

        return id;
    };
}

if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function (id) {
        clearTimeout(id);
    };
}
