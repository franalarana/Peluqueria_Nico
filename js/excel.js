/* excel.js — manejo del archivo Excel real (File System Access API + SheetJS) */

const SERVICIOS_RETOQUE = ["Color", "Mechas"];
const DIAS_RETOQUE = 30;

const PRECIOS_INICIALES = [
  { Servicio: "Corte", Precio: 15000 },
  { Servicio: "Color", Precio: 35000 },
  { Servicio: "Mechas", Precio: 45000 },
  { Servicio: "Masajes", Precio: 20000 },
  { Servicio: "Asesoría de Imagen", Precio: 30000 },
];

const DB_NAME = "peluqueria-nico-db";
const STORE_NAME = "handles";
const HANDLE_KEY = "excel-file-handle";

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarHandle(handle) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function leerHandleGuardado() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function verificarPermiso(handle, pedirSiFalta) {
  const opciones = { mode: "readwrite" };
  if ((await handle.queryPermission(opciones)) === "granted") return true;
  if (!pedirSiFalta) return false;
  return (await handle.requestPermission(opciones)) === "granted";
}

function construirWorkbookInicial() {
  const wb = XLSX.utils.book_new();
  const hojaReservas = XLSX.utils.aoa_to_sheet([
    ["Fecha", "Hora", "Clienta", "Telefono", "Servicio", "Precio", "Notas", "ProximoRetoque"],
  ]);
  const hojaPrecios = XLSX.utils.json_to_sheet(PRECIOS_INICIALES, {
    header: ["Servicio", "Precio"],
  });
  XLSX.utils.book_append_sheet(wb, hojaReservas, "Reservas");
  XLSX.utils.book_append_sheet(wb, hojaPrecios, "Precios");
  return wb;
}

async function crearArchivoNuevo() {
  const handle = await window.showSaveFilePicker({
    suggestedName: "Agenda_StudioNicoleFernandez.xlsx",
    types: [
      {
        description: "Excel",
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
      },
    ],
  });
  await guardarHandle(handle);
  const wb = construirWorkbookInicial();
  await escribirWorkbook(handle, wb);
  return handle;
}

async function abrirArchivoExistente() {
  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: "Excel",
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
      },
    ],
  });
  await guardarHandle(handle);
  return handle;
}

async function leerWorkbook(handle) {
  const archivo = await handle.getFile();
  const buffer = await archivo.arrayBuffer();
  return XLSX.read(buffer, { type: "array" });
}

async function escribirWorkbook(handle, wb) {
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const writable = await handle.createWritable();
  await writable.write(buffer);
  await writable.close();
}

function workbookAEstado(wb) {
  const reservas = XLSX.utils.sheet_to_json(wb.Sheets["Reservas"], { defval: "" });
  const precios = XLSX.utils.sheet_to_json(wb.Sheets["Precios"], { defval: "" });
  return { reservas, precios };
}

function estadoAWorkbook(estado) {
  const wb = XLSX.utils.book_new();
  const hojaReservas = XLSX.utils.json_to_sheet(estado.reservas, {
    header: ["Fecha", "Hora", "Clienta", "Telefono", "Servicio", "Precio", "Notas", "ProximoRetoque"],
  });
  const hojaPrecios = XLSX.utils.json_to_sheet(estado.precios, {
    header: ["Servicio", "Precio"],
  });
  XLSX.utils.book_append_sheet(wb, hojaReservas, "Reservas");
  XLSX.utils.book_append_sheet(wb, hojaPrecios, "Precios");
  return wb;
}

function sumarDias(fechaTexto, dias) {
  const [y, m, d] = fechaTexto.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  const yy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function calcularProximoRetoque(fecha, servicio) {
  if (!SERVICIOS_RETOQUE.includes(servicio)) return "";
  return sumarDias(fecha, DIAS_RETOQUE);
}
