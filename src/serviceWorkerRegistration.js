export function register() {
  unregister();
}
export function unregister() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });

  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch(() => {});
}
