# Manual de Usuario — Agenda Studio Nicole Fernández

Esta guía explica cómo usar el sistema paso a paso. No hace falta saber de computación, solo seguir los pasos.

## Qué necesitás

- Una computadora con el navegador **Google Chrome** o **Microsoft Edge** (los dos son gratis y ya vienen instalados en la mayoría de las PC con Windows).
- La carpeta del sistema (`Peluqueria_Nico`), que contiene un archivo llamado `index.html`.

No hace falta instalar nada más, ni tener internet para usarlo día a día.

---

## 1. Primera vez que lo usás

1. Abrí la carpeta `Peluqueria_Nico`.
2. Hacé **doble click** en el archivo `index.html`. Se va a abrir en el navegador.
3. Vas a ver una pantalla de bienvenida con dos botones:
   - **"Crear Excel nuevo"**: usalo la primera vez. El sistema te va a pedir que elijas dónde guardar el archivo Excel y con qué nombre (podés dejar el nombre que aparece sugerido: `Agenda_StudioNicoleFernandez.xlsx`). Guardalo en un lugar fácil de encontrar, por ejemplo el Escritorio o la misma carpeta `Peluqueria_Nico`.
   - **"Abrir Excel existente"**: usalo solo si ya tenías un Excel de este sistema hecho antes y querés seguir usando ese mismo archivo.
4. Después de elegir, el sistema se abre directo en la pantalla principal, con las pestañas **Agenda**, **Precios** y **Recordatorios**.

A partir de acá, cada vez que agregás o cambiás algo, se guarda solo en ese archivo Excel. No hay que apretar ningún botón de "guardar".

---

## 2. Uso de todos los días

1. Doble click en `index.html`.
2. El sistema recuerda cuál era tu archivo Excel. Va a aparecer un botón que dice **"Continuar"** — hacé click ahí.
   - Esto es un paso de seguridad que pide el navegador, no se puede evitar. Es un solo click.
3. Ya estás adentro, con todos los datos que cargaste antes.

Si alguna vez el sistema no reconoce el archivo anterior (por ejemplo, si moviste o borraste el Excel), usá "Abrir Excel existente" para indicarle dónde está, o "Crear Excel nuevo" si querés empezar de cero.

---

## 3. Reservar una hora (pestaña Agenda)

1. Completá el formulario de arriba: Fecha, Hora, Nombre de la clienta, Teléfono (opcional), Servicio, Precio (se completa solo según el servicio, pero se puede cambiar) y Notas (opcional).
2. Hacé click en **"Guardar reserva"**.
3. La reserva aparece en la tabla de abajo, ordenada por fecha.

**Para editar una reserva ya cargada:** hacé click en "Editar" en la fila correspondiente, cambiá lo que necesites en el formulario y volvé a apretar "Guardar reserva".

**Para borrar una reserva:** click en "Borrar" en esa fila (te va a pedir confirmación).

**Para ver el historial de una clienta:** escribí su nombre en el buscador que está arriba de la tabla — va a filtrar solo sus reservas (pasadas y futuras).

---

## 4. Precios de los servicios (pestaña Precios)

1. Para agregar un servicio nuevo: escribí el nombre y el precio, después click en **"Guardar precio"**.
2. Para cambiar el precio de un servicio existente: click en **"Editar"** en su fila, cambiá el precio (o el nombre) y click en "Guardar precio".
3. Para borrar un servicio: click en "Borrar" en su fila.

Los precios que cargués acá son los que después aparecen para elegir en la pestaña Agenda.

---

## 5. Recordatorios de retoque (pestaña Recordatorios)

Esta pestaña muestra un **calendario** a la izquierda y el detalle del día elegido a la derecha.

- Los días con algo cargado aparecen marcados con un puntito de color debajo del número:
  - 🔵 **Azul**: hay una reserva agendada ese día.
  - 🔴 **Rojo**: retoque de Color/Mechas vencido (ya debería haber pasado).
  - 🟠 **Naranja**: retoque de Color/Mechas próximo (todavía no llega la fecha).
- **Hacé click en cualquier día** del calendario para ver, a la derecha, el detalle completo: qué reservas hay y qué retoques caen ese día. Desde ahí también podés apretar "Editar" en una reserva para corregirla (te lleva directo a la pestaña Agenda con los datos cargados).
- Arriba del calendario hay 3 botones de filtro — **Todo**, **Solo reservas**, **Solo recordatorios** — para mostrar únicamente lo que te interesa, tanto en los puntitos del calendario como en el detalle de la derecha.
- Las flechas `<` y `>` junto al nombre del mes cambian de mes.

No hay que cargar nada extra para los retoques: se calculan solos a partir de las reservas de Color y Mechas que ya cargaste en la Agenda (30 días después de la fecha del servicio).

---

## 6. Preguntas frecuentes

**¿Puedo abrir el Excel directamente en Microsoft Excel?**
Sí. Es un archivo `.xlsx` normal, con una hoja "Reservas" y una hoja "Precios". Podés abrirlo, mirarlo o imprimirlo cuando quieras. Eso sí: mientras el sistema HTML esté abierto guardando cambios, evitá tener el Excel abierto al mismo tiempo para no pisar información.

**¿Qué hago si el navegador no me deja crear o abrir el archivo?**
Confirmá que estás usando Chrome o Edge (no funciona en Firefox ni Safari).

**¿Qué pasa si pierdo el archivo Excel?**
Con "Crear Excel nuevo" armás uno de cero, pero vas a perder el historial. Por eso conviene hacer una copia de seguridad de vez en cuando (ver siguiente punto).

**¿Cómo hago una copia de seguridad?**
Simplemente copiá el archivo `.xlsx` (el que elegiste al crear el Excel) a un pendrive, a una nube (Google Drive, OneDrive) o mandalo por mail una vez por semana. Es un archivo normal, se puede copiar como cualquier otro.

**¿Puedo usarlo en otra computadora?**
Sí: copiá la carpeta `Peluqueria_Nico` completa junto con el archivo `.xlsx` a la otra compu, abrí `index.html` ahí y usá "Abrir Excel existente" para apuntar al Excel copiado.

---

## 7. Ubicación de los archivos importantes

- Programa: carpeta `Peluqueria_Nico` (contiene `index.html` y todo lo necesario para que funcione — no borrar ni mover archivos de adentro).
- Base de datos: el archivo `.xlsx` que elegiste guardar la primera vez (la "memoria" real de toda la agenda).
