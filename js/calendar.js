/* calendar.js — calendario de reservas y recordatorios */

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const NOMBRES_DIA_LARGO = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const estadoCalendario = {
  anio: new Date().getFullYear(),
  mes: new Date().getMonth(),
  fechaSeleccionada: null,
  filtro: "todo",
};

function formatearFecha(anio, mes, dia) {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
}

function celdaDesdeFecha(fechaObj, esMesActual) {
  return {
    fecha: formatearFecha(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate()),
    diaNumero: fechaObj.getDate(),
    esMesActual,
  };
}

function generarCeldasDelMes(anio, mes) {
  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = [];

  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(celdaDesdeFecha(new Date(anio, mes, 1 - (primerDiaSemana - i)), false));
  }
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push(celdaDesdeFecha(new Date(anio, mes, dia), true));
  }
  while (celdas.length < 42) {
    const ultima = celdas[celdas.length - 1];
    const [ay, am, ad] = ultima.fecha.split("-").map(Number);
    celdas.push(celdaDesdeFecha(new Date(ay, am - 1, ad + 1), false));
  }
  return celdas;
}

function calcularMarcadores(reservas, filtro) {
  const hoy = hoyTexto();
  const mapa = {};
  const asegurar = (fecha) => (mapa[fecha] = mapa[fecha] || { reserva: false, retoqueVencido: false, retoqueProximo: false });

  reservas.forEach((r) => {
    if ((filtro === "todo" || filtro === "reservas") && r.Fecha) {
      asegurar(r.Fecha).reserva = true;
    }
    if ((filtro === "todo" || filtro === "recordatorios") && r.ProximoRetoque) {
      const dias = diasEntre(hoy, r.ProximoRetoque);
      const marcador = asegurar(r.ProximoRetoque);
      if (dias <= 0) marcador.retoqueVencido = true;
      else marcador.retoqueProximo = true;
    }
  });

  return mapa;
}

function formatearFechaLegible(fecha) {
  const [y, m, d] = fecha.split("-").map(Number);
  const fechaObj = new Date(y, m - 1, d);
  return `${NOMBRES_DIA_LARGO[fechaObj.getDay()]} ${d} de ${NOMBRES_MES[m - 1]} ${y}`;
}

function renderCalendario() {
  const { anio, mes, filtro } = estadoCalendario;
  el("etiquetaMes").textContent = `${NOMBRES_MES[mes]} ${anio}`;

  const marcadores = calcularMarcadores(estado.reservas, filtro);
  const celdas = generarCeldasDelMes(anio, mes);
  const hoy = hoyTexto();

  const grilla = el("grillaCalendario");
  grilla.innerHTML = "";
  celdas.forEach((c) => {
    const m = marcadores[c.fecha];
    const div = document.createElement("div");
    div.className = "dia-calendario";
    if (!c.esMesActual) div.classList.add("dia-fuera-de-mes");
    if (c.fecha === hoy) div.classList.add("dia-hoy");
    if (c.fecha === estadoCalendario.fechaSeleccionada) div.classList.add("dia-seleccionado");
    div.dataset.fecha = c.fecha;

    let puntos = "";
    if (m?.reserva) puntos += '<span class="punto punto-reserva"></span>';
    if (m?.retoqueVencido) puntos += '<span class="punto punto-vencido"></span>';
    if (m?.retoqueProximo) puntos += '<span class="punto punto-proximo"></span>';

    div.innerHTML = `<span class="numero-dia">${c.diaNumero}</span><span class="puntos">${puntos}</span>`;
    grilla.appendChild(div);
  });

  renderPanelDetalle();
}

function renderPanelDetalle() {
  const contenedor = el("panelDetalle");
  const fecha = estadoCalendario.fechaSeleccionada;

  if (!fecha) {
    contenedor.innerHTML = '<p class="vacio">Seleccioná un día del calendario para ver el detalle.</p>';
    return;
  }

  const filtro = estadoCalendario.filtro;
  let html = `<h3>${formatearFechaLegible(fecha)}</h3>`;

  if (filtro === "todo" || filtro === "reservas") {
    const reservasDia = estado.reservas
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.Fecha === fecha);

    html += "<h4>Reservas</h4>";
    if (reservasDia.length === 0) {
      html += '<p class="vacio">Sin reservas este día.</p>';
    } else {
      reservasDia.forEach(({ r, i }) => {
        html += `
          <div class="tarjeta-detalle">
            <strong>${r.Hora} — ${r.Clienta}</strong><br/>
            ${r.Servicio} · $${Number(r.Precio).toLocaleString("es-CL")}<br/>
            ${r.Notas ? r.Notas + "<br/>" : ""}
            <button class="boton-icono" data-editar-reserva="${i}">Editar</button>
          </div>`;
      });
    }
  }

  if (filtro === "todo" || filtro === "recordatorios") {
    const hoy = hoyTexto();
    const retoquesDia = estado.reservas.filter((r) => r.ProximoRetoque === fecha);

    html += "<h4>Recordatorios de retoque</h4>";
    if (retoquesDia.length === 0) {
      html += '<p class="vacio">Sin retoques ese día.</p>';
    } else {
      retoquesDia.forEach((r) => {
        const dias = diasEntre(hoy, r.ProximoRetoque);
        const textoEstado = dias <= 0 ? `Vencido hace ${Math.abs(dias)} día(s)` : `Faltan ${dias} día(s)`;
        const claseEstado = dias <= 0 ? "etiqueta-vencido" : "etiqueta-proximo";
        html += `
          <div class="tarjeta-detalle">
            <strong>${r.Clienta}</strong> — ${r.Servicio}<br/>
            Último servicio: ${r.Fecha}<br/>
            <span class="${claseEstado}">${textoEstado}</span>
          </div>`;
      });
    }
  }

  contenedor.innerHTML = html;
}
