/* app.js — estado en memoria y toda la interacción de la UI */

const estado = {
  handle: null,
  reservas: [],
  precios: [],
};

const el = (id) => document.getElementById(id);

function mostrarToast(mensaje, esError) {
  const toast = el("toast");
  toast.textContent = mensaje;
  toast.className = "toast visible" + (esError ? " error-toast" : "");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

async function guardarEstado() {
  try {
    const wb = estadoAWorkbook({ reservas: estado.reservas, precios: estado.precios });
    await escribirWorkbook(estado.handle, wb);
    mostrarToast("Guardado ✓");
  } catch (err) {
    console.error(err);
    mostrarToast("No se pudo guardar el Excel: " + err.message, true);
  }
}

function mostrarApp() {
  el("pantallaInicio").style.display = "none";
  el("app").style.display = "block";
}

async function cargarAppConHandle(handle) {
  estado.handle = handle;
  const wb = await leerWorkbook(handle);
  const datos = workbookAEstado(wb);
  estado.reservas = datos.reservas;
  estado.precios = datos.precios;
  el("estadoArchivo").textContent = "Archivo: " + handle.name;
  mostrarApp();
  renderTodo();
}

function renderTodo() {
  renderSelectServicios();
  renderTablaReservas();
  renderTablaPrecios();
  renderCalendario();
}

/* ---------- Pantalla de inicio ---------- */

async function iniciar() {
  el("campoFecha").value = hoyTexto();

  let handleGuardado = null;
  try {
    handleGuardado = await leerHandleGuardado();
  } catch (err) {
    console.error(err);
  }

  if (handleGuardado) {
    const permisoOk = await verificarPermiso(handleGuardado, false);
    if (permisoOk) {
      await cargarAppConHandle(handleGuardado);
      return;
    }
    el("mensajeInicio").textContent = "Encontramos tu agenda anterior. Hacé click en Continuar para volver a entrar.";
    el("btnCrear").style.display = "none";
    el("btnAbrir").style.display = "none";
    el("btnContinuar").style.display = "inline-block";
  }
}

el("btnCrear").addEventListener("click", async () => {
  try {
    const handle = await crearArchivoNuevo();
    await cargarAppConHandle(handle);
  } catch (err) {
    if (err.name !== "AbortError") {
      el("errorInicio").textContent = "No se pudo crear el archivo: " + err.message;
    }
  }
});

el("btnAbrir").addEventListener("click", async () => {
  try {
    const handle = await abrirArchivoExistente();
    await cargarAppConHandle(handle);
  } catch (err) {
    if (err.name !== "AbortError") {
      el("errorInicio").textContent = "No se pudo abrir el archivo: " + err.message;
    }
  }
});

el("btnContinuar").addEventListener("click", async () => {
  try {
    const handleGuardado = await leerHandleGuardado();
    const permisoOk = await verificarPermiso(handleGuardado, true);
    if (permisoOk) {
      await cargarAppConHandle(handleGuardado);
    } else {
      el("errorInicio").textContent = "No se dio permiso para usar el archivo.";
    }
  } catch (err) {
    el("errorInicio").textContent = "Error: " + err.message;
  }
});

/* ---------- Tabs ---------- */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("activa"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("activa"));
    btn.classList.add("activa");
    el("tab-" + btn.dataset.tab).classList.add("activa");
  });
});

/* ---------- Agenda / Reservas ---------- */

function renderSelectServicios() {
  const select = el("campoServicio");
  const valorPrevio = select.value;
  select.innerHTML = "";
  estado.precios.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.Servicio;
    opt.textContent = p.Servicio;
    select.appendChild(opt);
  });
  if (valorPrevio && estado.precios.some((p) => p.Servicio === valorPrevio)) {
    select.value = valorPrevio;
  }
  actualizarPrecioSegunServicio();
}

function actualizarPrecioSegunServicio() {
  const servicio = el("campoServicio").value;
  const precioObj = estado.precios.find((p) => p.Servicio === servicio);
  if (precioObj && el("reservaIndiceEdicion").value === "") {
    el("campoPrecio").value = precioObj.Precio;
  }
}

el("campoServicio").addEventListener("change", actualizarPrecioSegunServicio);

function renderTablaReservas() {
  const filtro = el("buscarClienta").value.trim().toLowerCase();
  const cuerpo = el("cuerpoTablaReservas");
  cuerpo.innerHTML = "";

  const conIndice = estado.reservas.map((r, i) => ({ r, i }));
  const filtradas = conIndice
    .filter(({ r }) => !filtro || String(r.Clienta).toLowerCase().includes(filtro))
    .sort((a, b) => (a.r.Fecha + a.r.Hora).localeCompare(b.r.Fecha + b.r.Hora));

  filtradas.forEach(({ r, i }) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${r.Fecha}</td>
      <td>${r.Hora}</td>
      <td>${r.Clienta}</td>
      <td>${r.Telefono || ""}</td>
      <td>${r.Servicio}</td>
      <td>$${Number(r.Precio).toLocaleString("es-CL")}</td>
      <td>${r.Notas || ""}</td>
      <td>${r.ProximoRetoque || "-"}</td>
      <td class="acciones">
        <button class="boton-icono" data-accion="editar" data-indice="${i}">Editar</button>
        <button class="boton-icono boton-borrar" data-accion="borrar" data-indice="${i}">Borrar</button>
      </td>`;
    cuerpo.appendChild(fila);
  });
}

el("cuerpoTablaReservas").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const i = Number(btn.dataset.indice);
  if (btn.dataset.accion === "editar") {
    cargarReservaEnFormulario(i);
  } else if (btn.dataset.accion === "borrar") {
    if (confirm("¿Borrar esta reserva?")) {
      estado.reservas.splice(i, 1);
      guardarEstado();
      renderTablaReservas();
      renderCalendario();
    }
  }
});

function cargarReservaEnFormulario(i) {
  const r = estado.reservas[i];
  el("reservaIndiceEdicion").value = i;
  el("campoFecha").value = r.Fecha;
  el("campoHora").value = r.Hora;
  el("campoClienta").value = r.Clienta;
  el("campoTelefono").value = r.Telefono || "";
  el("campoServicio").value = r.Servicio;
  el("campoPrecio").value = r.Precio;
  el("campoNotas").value = r.Notas || "";
  el("btnCancelarEdicion").style.display = "inline-block";
  document.querySelector('.tab-btn[data-tab="agenda"]').click();
  el("formReserva").scrollIntoView({ behavior: "smooth" });
}

el("btnCancelarEdicion").addEventListener("click", () => {
  resetearFormularioReserva();
});

function resetearFormularioReserva() {
  el("formReserva").reset();
  el("reservaIndiceEdicion").value = "";
  el("campoFecha").value = hoyTexto();
  el("btnCancelarEdicion").style.display = "none";
  actualizarPrecioSegunServicio();
}

el("formReserva").addEventListener("submit", (e) => {
  e.preventDefault();
  const fecha = el("campoFecha").value;
  const servicio = el("campoServicio").value;
  const reserva = {
    Fecha: fecha,
    Hora: el("campoHora").value,
    Clienta: el("campoClienta").value.trim(),
    Telefono: el("campoTelefono").value.trim(),
    Servicio: servicio,
    Precio: Number(el("campoPrecio").value),
    Notas: el("campoNotas").value.trim(),
    ProximoRetoque: calcularProximoRetoque(fecha, servicio),
  };

  const indiceEdicion = el("reservaIndiceEdicion").value;
  if (indiceEdicion === "") {
    estado.reservas.push(reserva);
  } else {
    estado.reservas[Number(indiceEdicion)] = reserva;
  }

  guardarEstado();
  resetearFormularioReserva();
  renderTablaReservas();
  renderCalendario();
});

el("buscarClienta").addEventListener("input", renderTablaReservas);

/* ---------- Precios ---------- */

function renderTablaPrecios() {
  const cuerpo = el("cuerpoTablaPrecios");
  cuerpo.innerHTML = "";
  estado.precios.forEach((p, i) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${p.Servicio}</td>
      <td>$${Number(p.Precio).toLocaleString("es-CL")}</td>
      <td class="acciones">
        <button class="boton-icono" data-accion="editar" data-indice="${i}">Editar</button>
        <button class="boton-icono boton-borrar" data-accion="borrar" data-indice="${i}">Borrar</button>
      </td>`;
    cuerpo.appendChild(fila);
  });
}

el("cuerpoTablaPrecios").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const i = Number(btn.dataset.indice);
  if (btn.dataset.accion === "editar") {
    cargarPrecioEnFormulario(i);
  } else if (btn.dataset.accion === "borrar") {
    if (confirm(`¿Borrar el servicio "${estado.precios[i].Servicio}"?`)) {
      estado.precios.splice(i, 1);
      guardarEstado();
      resetearFormularioPrecio();
      renderTablaPrecios();
      renderSelectServicios();
    }
  }
});

function cargarPrecioEnFormulario(i) {
  const p = estado.precios[i];
  el("precioIndiceEdicion").value = i;
  el("campoNombreServicio").value = p.Servicio;
  el("campoValorServicio").value = p.Precio;
  el("btnCancelarEdicionPrecio").style.display = "inline-block";
  el("campoNombreServicio").focus();
}

function resetearFormularioPrecio() {
  el("formPrecio").reset();
  el("precioIndiceEdicion").value = "";
  el("btnCancelarEdicionPrecio").style.display = "none";
}

el("btnCancelarEdicionPrecio").addEventListener("click", resetearFormularioPrecio);

el("formPrecio").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = el("campoNombreServicio").value.trim();
  const valor = Number(el("campoValorServicio").value);
  const indiceEdicion = el("precioIndiceEdicion").value;

  if (indiceEdicion !== "") {
    estado.precios[Number(indiceEdicion)] = { Servicio: nombre, Precio: valor };
  } else {
    const existente = estado.precios.find((p) => p.Servicio.toLowerCase() === nombre.toLowerCase());
    if (existente) {
      existente.Precio = valor;
    } else {
      estado.precios.push({ Servicio: nombre, Precio: valor });
    }
  }

  guardarEstado();
  resetearFormularioPrecio();
  renderTablaPrecios();
  renderSelectServicios();
});

/* ---------- Calendario (recordatorios) ---------- */

el("btnMesAnterior").addEventListener("click", () => {
  estadoCalendario.mes--;
  if (estadoCalendario.mes < 0) {
    estadoCalendario.mes = 11;
    estadoCalendario.anio--;
  }
  estadoCalendario.fechaSeleccionada = null;
  renderCalendario();
});

el("btnMesSiguiente").addEventListener("click", () => {
  estadoCalendario.mes++;
  if (estadoCalendario.mes > 11) {
    estadoCalendario.mes = 0;
    estadoCalendario.anio++;
  }
  estadoCalendario.fechaSeleccionada = null;
  renderCalendario();
});

document.querySelectorAll(".filtro-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("activa"));
    btn.classList.add("activa");
    estadoCalendario.filtro = btn.dataset.filtro;
    renderCalendario();
  });
});

el("grillaCalendario").addEventListener("click", (e) => {
  const dia = e.target.closest(".dia-calendario");
  if (!dia) return;
  estadoCalendario.fechaSeleccionada = dia.dataset.fecha;
  renderCalendario();
});

el("panelDetalle").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-editar-reserva]");
  if (!btn) return;
  cargarReservaEnFormulario(Number(btn.dataset.editarReserva));
});

iniciar();
