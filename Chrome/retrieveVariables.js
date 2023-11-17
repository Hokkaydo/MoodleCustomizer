(async () => {
    if (window.M) {
        document.dispatchEvent(new CustomEvent('RetrieveVariable', { detail: "sesskey=" + window.M.cfg.sesskey }));
    }
})();
