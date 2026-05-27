export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }
}
export function unregister() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then((r) => r.unregister());
}
