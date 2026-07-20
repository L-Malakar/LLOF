// Generates every raster favicon size from logo.svg on the fly:
    // tab favicon, Apple touch icon, Android/PWA manifest icons, and
    // social share preview image (og:image / twitter:image).
    (function () {
      const SIZES = [16, 32, 48, 64, 180, 192, 512]; // 180=apple-touch, 192/512=PWA, 512 also used for share
      const img = new Image();

      img.onload = function () {
        const urls = {};

        SIZES.forEach(size => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, size, size);
          try {
            urls[size] = canvas.toDataURL('image/png');
          } catch (e) {
            console.warn('Could not generate PNG for size', size, e);
          }
        });
        if (!urls[64]) return; // nothing worked, likely a file:// canvas taint issue

        function addLink(rel, href, extra) {
          const link = document.createElement('link');
          link.rel = rel;
          link.href = href;
          if (extra) Object.assign(link, extra);
          document.head.appendChild(link);
        }
        function addMeta(property, content, useName) {
          const meta = document.createElement('meta');
          meta[useName ? 'name' : 'property'] = property;
          meta.content = content;
          document.head.appendChild(meta);
        }

        // Tab favicon fallback (PNG) for browsers that ignore SVG favicons
        addLink('icon', urls[64], { type: 'image/png' });

        // iOS "Add to Home Screen" icon
        if (urls[180]) addLink('apple-touch-icon', urls[180]);

        // Android / PWA manifest (built inline as a Blob since we have no manifest.json file)
        if (urls[192] && urls[512]) {
          const manifest = {
            name: document.title,
            icons: [
              { src: urls[192], sizes: '192x192', type: 'image/png' },
              { src: urls[512], sizes: '512x512', type: 'image/png' }
            ]
          };
          const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          addLink('manifest', URL.createObjectURL(manifestBlob));
        }

        // Social share preview image (Facebook/Discord/Slack/Twitter link unfurls)
        if (urls[512]) {
          addMeta('og:image', urls[512]);
          addMeta('twitter:image', urls[512]);
        }
      };

      img.onerror = function () {
        console.warn('logo.svg failed to load — no icons set.');
      };
      img.src = 'asset/logo.svg';
    })();