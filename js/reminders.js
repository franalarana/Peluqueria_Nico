/* reminders.js — helpers de fecha compartidos por app.js y calendar.js */

function hoyTexto() {
  const hoy = new Date();
  const yy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function diasEntre(fechaA, fechaB) {
  const [ay, am, ad] = fechaA.split("-").map(Number);
  const [by, bm, bd] = fechaB.split("-").map(Number);
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / msPorDia);
}
