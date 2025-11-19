# Instrucciones para PWA / TWA (español)

Resumen rápido
- El proyecto ya tiene `manifest.json` y un `sw.js` en `public/` y un componente `app/register-sw.tsx` que registra el SW.
- He actualizado el `sw.js` con mejores estrategias de caché y el registro para gestionar actualizaciones.

Pasos recomendados (prioritarios)
1. Añadir iconos PNG (varios tamaños) en `public/icons/` — por ejemplo: `icon-192.png`, `icon-512.png`.
   - Actualiza `public/manifest.json` para referenciar estos PNGs con `sizes` y `purpose` (`any maskable`). Muchos navegadores esperan PNG en el manifiesto.
2. Probar localmente en modo producción y auditar con Lighthouse:
   - En PowerShell:
     ```powershell
     npm run build
     npm run start
     ```
   - Abrir `http://localhost:3000` en Chrome, abrir DevTools → Lighthouse → generar informe (seleccionar PWA).

Errores y rendimiento comunes y cómo resolverlos
- Iconos SVG en el manifiesto: algunos sistemas (Android/Chrome) no respetan SVG para los iconos. Añade PNG con las dimensiones comunes (192, 512).
- Estrategia de caché inapropiada: si el SW siempre intenta red de primero para todo eso puede ralentizar la carga. El SW ahora aplica cache-first para `/_next/`, imágenes y fuentes, y network-first para navegaciones.
- Desarrollo vs Producción: el SW puede comportarse de forma extraña con `next dev`. Siempre prueba SW en `next build && next start` (modo producción).

Si quieres un PWA robusto (recomendado)
- Considera integrar `next-pwa` o Workbox para generar un SW con precaching automático de `_next/static`. Verifica compatibilidad con la versión de `next` que usas.
- Ventajas: menos mantenimiento manual, mejor control de runtimeCaching y precaching de recursos construidos.

Convertir a TWA (Android) — resumen
1. Genera una release HTTPS del sitio (necesitas dominio con HTTPS). TWA requiere que la web esté publicada en HTTPS.
2. Crea `assetlinks.json` y configúralo en `https://<tu-dominio>/.well-known/assetlinks.json` (necesitas el SHA256 de la clave del paquete Android).
3. Usa Bubblewrap (https://github.com/GoogleChromeLabs/bubblewrap) para generar el proyecto Android:
   - Instalar: `npm install -g @bubblewrap/cli`
   - `bubblewrap init --manifest=https://tu-dominio/manifest.json`
   - `bubblewrap build` y luego abre el proyecto Android en Android Studio.

Notas finales
- Si quieres, puedo:
  - Generar una lista de archivos que faltan (iconos PNG) y un `manifest.json` de ejemplo actualizado.
  - Integrar `next-pwa` en `next.config.ts` (si confirmas que quieres usarlo).
  - Preparar pasos detallados para crear un TWA con Bubblewrap y un `assetlinks.json` de ejemplo.

Indícame qué prefieres: mejorar el PWA actual (arreglar iconos, optimizar SW y pruebas) o preparar el flujo para crear un TWA.
