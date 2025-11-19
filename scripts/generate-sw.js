const workboxBuild = require('workbox-build');

// This script generates a service worker using workbox-build
// It will write `public/sw.js` and precache all matching assets.

const SW_DEST = 'public/sw.js';

(async () => {
  try {
    const { count, size, warnings } = await workboxBuild.generateSW({
      swDest: SW_DEST,
      globDirectory: '.',
      globPatterns: [
        'public/**/*.{js,css,html,png,svg,json,xml,ico,webmanifest}',
        '.next/static/**/*.*',
        '.next/static/media/**/*.*'
      ],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          // Network-first for navigation requests
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
            }
          }
        },
        {
          // Cache-first for _next and static resources
          urlPattern: /\/_next\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 150,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            }
          }
        },
        {
          // Images
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 24 * 60 * 60 // 60 days
            }
          }
        },
        {
          // Fonts
          urlPattern: /\.(?:woff2?|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
            }
          }
        }
      ]
    });

    if (warnings && warnings.length) {
      console.warn('Workbox warnings:', warnings);
    }

    console.log(`Generated ${SW_DEST}, which will precache ${count} files, totaling ${size} bytes.`);
  } catch (err) {
    console.error('Failed to generate service worker:', err);
    process.exitCode = 1;
  }
})();
