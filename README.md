# Credit Management Frontend

README listo para copiar al repositorio Frontend inspeccionado en `D:\credit-management-frontend`. Se mantiene aquí para entregar ambos repositorios sin modificar archivos fuera de este workspace.

SPA del sistema de gestión de créditos: solicitud pública y simulador, acceso del equipo interno, administración de solicitudes/clientes/usuarios y registro de pagos por cajero.

## Stack y requisitos

React 18.3, React Router 6.28, Vite 5.4 y JavaScript con CSS propio. Node.js con npm; no hay versión engines declarada. Backend accesible con CORS autorizado para el origen del Frontend. `package-lock.json` fija dependencias instalables mediante `npm ci`.

## Instalación

1. Ejecutar `npm ci` en la raíz del Frontend.
2. Copiar `.env.example` a `.env` y establecer `VITE_API_URL=http://localhost:3000/api/v1` para desarrollo.
3. Ejecutar `npm run dev`; Vite está configurado en puerto 5173.
4. Autorizar `http://localhost:5173` en `CORS_ORIGINS` del Backend.
5. Para compilar: `npm run build`. Para inspeccionar el resultado: `npm run preview` y autorizar su origen real en CORS.

Las variables VITE se incorporan al bundle: no colocar secretos ni credenciales de BD en ellas. El token se recibe de login y se guarda con el usuario en sessionStorage, no en variables de build.

## Estructura

```text
src/
  main.jsx           # BrowserRouter y montaje React
  App.jsx            # Rutas y guardas por sesión/rol
  api.js             # Fetch, Bearer y manejo de 401
  auth.js            # sessionStorage, expiración y redirección por rol
  Shell.jsx          # Marco de pantallas públicas
  PanelFrame.jsx     # Identidad, pestañas y cierre de sesión
  CustomerDialog.jsx # Alta/edición reutilizable de cliente
  Simulator.jsx      # Cuota y cronograma, consulta con demora de 500 ms
  pages/             # Diez pantallas; Credits se incrusta en Panel
  styles.css         # Estilos de la aplicación
vercel.json          # Rewrite de rutas SPA a /index.html
```

## Rutas

| Ruta | Acceso |
|---|---|
| `/` | Público: formulario de solicitud y simulador |
| `/login` | Público: acceso del equipo |
| `/forgot-password` | Público: solicitar enlace |
| `/reset-password` | Público: restablecer con token de query |
| `/panel` | ADMIN, ADVISOR |
| `/panel/credits/new` | ADMIN, ADVISOR |
| `/panel/credits/:id` | ADMIN, ADVISOR; decisiones y desembolso solo ADMIN |
| `/panel/customers` | ADMIN, ADVISOR |
| `/panel/users` | ADMIN |
| `/panel/collections` | CASHIER |

Ruta desconocida redirige a `/`. CASHIER entra directamente en Cobros; los otros roles en `/panel`. Cerrar sesión limpia el almacenamiento de la pestaña. Un 401 cuando existe token redirige a `/login?expired=1`.

## Integración y despliegue

`api.js` concatena VITE_API_URL y el path de la operación. Agrega `Content-Type: application/json` y Bearer cuando hay sesión. Los permisos del navegador no reemplazan la autorización del Backend.

Existe rewrite SPA para Vercel. Configurar build `npm run build`, salida `dist`, variable VITE_API_URL con la base pública HTTPS de la API y origen del Frontend en CORS del Backend. Sitio desplegado: https://credit-management-frontend.vercel.app/. Backend desplegado: https://credit-management-backend.vercel.app/, con PostgreSQL en Supabase, según confirmación del responsable. La base pública para VITE_API_URL es https://credit-management-backend.vercel.app/api/v1. Cambiar una variable VITE requiere recompilar.

## Verificación y limitaciones

Solo hay scripts dev, build y preview; no existen tests, lint o integración SonarQube evidenciados. El build no acredita aceptación funcional. Verificar con datos sintéticos login por rol, expiración, solicitudes, decisiones, desembolso, clientes/usuarios y abonos/pago completo en Cobros.

CustomerDialog permite editar nombres pero el Backend actual ignora esos campos al actualizar. El reset de contraseña tiene validación más estricta en UI que en API. Consentimiento y honeypot del formulario no se persisten en el Backend. Los recibos son de pantalla, sin descarga PDF. Corregir estas diferencias en un cambio de implementación separado.

La documentación completa se entrega en el repositorio Backend, bajo `docs/CONFLUENCE_DOCUMENTATION.md`, `docs/DIAGRAMS.md` y `docs/openapi.yaml`; ajustar enlaces al copiar este README al repositorio Frontend.
