# Documentación Técnica — Agenda Studio Nicole Fernández

Este documento explica cómo está construido el sistema, para quien tenga que mantenerlo o modificarlo más adelante. Para instrucciones de uso del día a día, ver `MANUAL_USUARIO.md`.

## 1. Objetivo y alcance

Demo de agenda para una peluquería:

- Reserva de horas por clienta.
- Historial de servicios por clienta (búsqueda en la misma tabla de reservas).
- Manejo de precios por servicio.
- Recordatorio automático de retoque (30 días) para Color y Mechas.
- Vista calendario de reservas y recordatorios.

Requerimiento explícito del cliente: la interfaz es HTML, la base de datos es un archivo Excel real (no una base de datos tradicional, no backend).

## 2. Arquitectura

**100% cliente, sin servidor.** Todo corre abriendo `index.html` directo en el navegador (`file://`).

- **Lectura/escritura del Excel real**: [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (`showOpenFilePicker`, `showSaveFilePicker`, `FileSystemFileHandle`). Disponible en Chrome y Edge; no funciona en Firefox ni Safari. Funciona sobre `file://` porque Chromium trata los orígenes `file:` como contexto seguro — no hace falta servidor local ni HTTPS.
- **Parseo/generación de `.xlsx`**: [SheetJS](https://sheetjs.com/) (`vendor/xlsx.full.min.js`), vendorizado localmente (descargado una vez, sin depender de un CDN) para que la app funcione sin internet después de la primera instalación.
- **Persistencia del permiso de archivo**: el `FileSystemFileHandle` se guarda en **IndexedDB** (`js/excel.js`) para no tener que re-seleccionar el archivo en cada sesión. El navegador igual exige reconfirmar el permiso de escritura después de cerrar y reabrir — por eso existe el botón "Continuar" en la pantalla de inicio.
- **Scripts clásicos, no módulos ES**: los `<script>` NO usan `type="module"` porque los módulos ES están bloqueados por CORS al cargarlos desde `file://` en Chrome. Todo el JS comparte el mismo scope global (`estado`, `el`, etc. son variables/funciones globales compartidas entre archivos).

## 3. Estructura de archivos

```
Peluqueria_Nico/
├── index.html              shell de la app: pantalla de inicio + 3 pestañas
├── css/styles.css          estilos (paleta cálida, sin dependencias externas)
├── js/
│   ├── excel.js            crear/abrir archivo, leer/escribir workbook, permisos (IndexedDB)
│   ├── reminders.js        helpers de fecha compartidos (hoyTexto, diasEntre)
│   ├── calendar.js         lógica y render del calendario de recordatorios
│   └── app.js              estado en memoria, render de Agenda/Precios, todos los event listeners
├── vendor/xlsx.full.min.js SheetJS vendorizado
├── README.md                resumen rápido del proyecto
├── MANUAL_USUARIO.md         guía paso a paso para la persona que usa la app
└── DOCUMENTACION_TECNICA.md  este documento
```

Orden de carga de scripts en `index.html` (importa, `calendar.js` y `app.js` dependen de funciones definidas en los anteriores):
`vendor/xlsx.full.min.js` → `js/excel.js` → `js/reminders.js` → `js/calendar.js` → `js/app.js`.

## 4. Modelo de datos (el Excel)

**Hoja "Reservas"** — una fila por reserva:

| Columna | Tipo | Notas |
|---|---|---|
| Fecha | texto `YYYY-MM-DD` | se guarda como texto, no como fecha serial de Excel, para evitar líos de zona horaria/formato al leer y escribir |
| Hora | texto `HH:MM` | |
| Clienta | texto | |
| Telefono | texto | opcional |
| Servicio | texto | debe coincidir con un `Servicio` de la hoja Precios |
| Precio | número | |
| Notas | texto | opcional |
| ProximoRetoque | texto `YYYY-MM-DD` o vacío | calculado automáticamente, ver punto 5 |

**Hoja "Precios"** — una fila por servicio:

| Columna | Tipo |
|---|---|
| Servicio | texto |
| Precio | número |

Placeholders iniciales (se cargan solo la primera vez, al crear el Excel desde la app): Corte $15.000, Color $35.000, Mechas $45.000, Masajes $20.000, Asesoría de Imagen $30.000.

## 5. Lógica de negocio

**Cálculo de `ProximoRetoque`** (`js/excel.js`, función `calcularProximoRetoque(fecha, servicio)`):
Solo se calcula (Fecha + 30 días) si el servicio está en `SERVICIOS_RETOQUE = ["Color", "Mechas"]`. Para cualquier otro servicio queda vacío. Se calcula una sola vez, al guardar la reserva, y se guarda como valor fijo en la hoja — no se recalcula después en base a la fecha actual.

Para cambiar los servicios con retoque o la cantidad de días, editar las constantes al inicio de `js/excel.js`:
```js
const SERVICIOS_RETOQUE = ["Color", "Mechas"];
const DIAS_RETOQUE = 30;
```

**Vencido vs. próximo** (`js/calendar.js`, función `calcularMarcadores` y `renderPanelDetalle`):
Se compara `ProximoRetoque` contra la fecha de hoy (`diasEntre`, en `js/reminders.js`). `diasParaRetoque <= 0` → vencido (rojo). `diasParaRetoque > 0` → próximo (naranja). No hay límite superior: se muestran todos los retoques futuros, sin importar cuán lejos estén.

**Calendario** (`js/calendar.js`):
- `generarCeldasDelMes(anio, mes)` arma una grilla fija de 42 celdas (6 semanas, lunes a domingo), incluyendo días del mes anterior/siguiente para completar la grilla.
- `calcularMarcadores(reservas, filtro)` recorre las reservas y arma un mapa `fecha -> { reserva, retoqueVencido, retoqueProximo }`, respetando el filtro activo ("todo" / "reservas" / "recordatorios").
- El estado de navegación del calendario (mes/año mostrado, día seleccionado, filtro activo) vive en `estadoCalendario` (objeto global en `js/calendar.js`), separado de `estado` (los datos del Excel, en `js/app.js`).

## 6. Flujo de la aplicación

1. Al cargar `index.html`, `app.js` llama a `iniciar()`.
2. `iniciar()` busca un `FileSystemFileHandle` guardado en IndexedDB (`leerHandleGuardado`).
   - Si existe y el permiso sigue vigente (`verificarPermiso(handle, false)`), carga la app directo (`cargarAppConHandle`).
   - Si existe pero el permiso se perdió (reinicio de navegador), muestra el botón "Continuar", que vuelve a pedir permiso con `verificarPermiso(handle, true)` (requiere click del usuario, exigencia del navegador).
   - Si no existe ningún handle, muestra los botones "Crear Excel nuevo" / "Abrir Excel existente".
3. `cargarAppConHandle(handle)` lee el workbook completo (`leerWorkbook`), lo convierte a arrays JS (`workbookAEstado`), y llama a `renderTodo()`.
4. Cada acción que modifica datos (guardar/borrar reserva, guardar/borrar precio) actualiza el array en memoria (`estado.reservas` / `estado.precios`) y llama a `guardarEstado()`, que reconstruye el workbook completo (`estadoAWorkbook`) y lo escribe de vuelta al archivo real (`escribirWorkbook`). No hay guardado incremental: cada cambio reescribe el archivo entero (aceptable para el volumen de datos de una peluquería).

## 7. Decisiones de diseño y por qué

- **File System Access API en vez de servidor/Live Server**: para que la persona que usa el sistema (sin experiencia en PC) solo tenga que hacer doble click, sin instalar nada ni levantar un servidor local.
- **Fechas como texto plano** (no fecha serial de Excel): evita ambigüedad de formato regional y de zona horaria al leer/escribir con SheetJS; a cambio, ordenar/filtrar por fecha en Excel funciona bien igual porque el formato `YYYY-MM-DD` ordena alfabéticamente igual que cronológicamente.
- **SheetJS vendorizado localmente**: para que la app funcione sin internet una vez instalada (no depende de que un CDN esté arriba).
- **Reescribir el archivo completo en cada guardado**: mucho más simple que un guardado incremental/parcial, y sin impacto de performance perceptible al volumen de datos esperado (una peluquería, no una cadena).
- **Sin backend/base de datos tradicional**: pedido explícito del cliente (Excel como "base de datos").

## 8. Limitaciones conocidas

- Solo funciona en **Chrome o Edge** (File System Access API no está en Firefox/Safari).
- **Un solo archivo Excel a la vez**, sin sincronización entre PCs. Si se usa en más de una computadora, hay que copiar el archivo manualmente entre ellas (ver "¿Puedo usarlo en otra computadora?" en `MANUAL_USUARIO.md`).
- **Sin control de concurrencia**: si dos personas abren la app apuntando al mismo archivo al mismo tiempo, el último guardado gana y puede pisar cambios del otro.
- **Sin login/roles de usuario** — cualquiera que abra el archivo puede ver y editar todo.
- El navegador pide reconfirmar el permiso de escritura en cada sesión nueva (limitación de seguridad del navegador, no se puede evitar con un solo click de menos).

## 9. Cómo probar cambios

No hay test automatizado de UI (requiere interacción real con el selector de archivos nativo del sistema operativo, que no se puede automatizar fácilmente). Para verificar cambios:

1. **Lógica pura** (cálculo de fechas, armado de workbook, marcadores del calendario): se puede probar con Node cargando los archivos `js/*.js` en un `vm.Context` con `XLSX` como global (así se validó originalmente esta app — ver historial de conversación/commits para el detalle de esos scripts de prueba, no forman parte del proyecto final).
2. **UI real**: abrir `index.html` en Chrome/Edge, probar manualmente el flujo completo (crear Excel, cargar reserva, cerrar/reabrir navegador, editar precio, navegar el calendario).

## 10. Cómo extender

- **Agregar un campo a las reservas**: agregar la columna en el `header` de `estadoAWorkbook` (`js/excel.js`), en el formulario (`index.html`), y en el objeto `reserva` que arma el listener de `formReserva` (`js/app.js`).
- **Cambiar colores/paleta**: variables CSS en `:root` al inicio de `css/styles.css`.
- **Cambiar qué servicios generan retoque o cada cuántos días**: constantes `SERVICIOS_RETOQUE` y `DIAS_RETOQUE` en `js/excel.js`.
- **Multi-sucursal o multiusuario real**: requeriría reemplazar el Excel local por un backend con base de datos — cambio de arquitectura, no una extensión menor.
