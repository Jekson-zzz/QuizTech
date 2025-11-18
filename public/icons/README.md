Recomendaciones para los iconos del PWA

Coloca aquí los iconos referenciados por `public/manifest.json`:

- `icon-192.png` (192x192) — usado como `favicon`/icon principal
- `icon-512.png` (512x512) — usado para la pantalla de inicio y Play Store
- `maskable-512.png` (512x512) — versión maskable recomendada para iconos adaptativos

Cómo generar (usando ImageMagick en Windows PowerShell):

```powershell
# A partir de un archivo fuente (logo.svg o logo.png)
magick convert path\to\logo.svg -resize 192x192 public\icons\icon-192.png
magick convert path\to\logo.svg -resize 512x512 public\icons\icon-512.png
magick convert path\to\logo.svg -resize 512x512 public\icons\maskable-512.png
```

Si no tienes ImageMagick, puedes usar herramientas online (pwa-icon-generator) o npm packages como `@twa-dev/asset-generator`.

Notas:
- Guarda los archivos en `public/icons/` para que Next.js los sirva desde `/icons/...`.
- Asegúrate de que el `manifest.json` tenga las rutas correctas (`/icons/icon-192.png`, etc.).
- Para pruebas en Android/Chrome, visita `chrome://inspect` y añade la web a la pantalla de inicio para verificar el icono y el tema.

Actualización: se ha añadido `brain-logo.svg` a esta carpeta — una versión SVG del logo que aparece en la página de login.

Recomendación rápida:
- Genera PNGs (`icon-192.png`, `icon-512.png`, `maskable-512.png`) a partir de `brain-logo.svg` para compatibilidad total con Android/Chrome.

Si quieres que los genere por ti automáticamente con Node (`sharp`) o con ImageMagick aquí, dímelo y lo hacemos.
