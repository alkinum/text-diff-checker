const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    // Listen for when the service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker: New service worker took control');
      // Optionally reload the page to ensure fresh content
      // window.location.reload();
    });

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker: Registration successful');

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_READY') {
          console.log('Service Worker: Ready and controlling clients', event.data);
        }
      });

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        console.log('Service Worker: New version installing...');

        installingWorker.onstatechange = () => {
          console.log('Service Worker: State changed to', installingWorker.state);

          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('Service Worker: New content available, activating immediately');

              // Force the new service worker to take control
              installingWorker.postMessage({ type: 'SKIP_WAITING' });

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Service Worker: Content cached for offline use');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }

          if (installingWorker.state === 'activated') {
            console.log('Service Worker: New version activated');
            // Optionally reload the page to use new version immediately
            // window.location.reload();
          }
        };
      };

      // Check if there's an update waiting
      if (registration.waiting) {
        console.log('Service Worker: Update waiting, activating...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}