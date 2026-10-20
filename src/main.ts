import "./style.css";
import { calcular, labelSemester } from "./calc";

declare global {
  interface Window {
    umami?: { track: (name: string) => void };
  }
}

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const pct = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Falta #${id}`);
  return e as T;
}

function row(label: string, value: string, cls = ""): HTMLDivElement {
  const r = document.createElement("div");
  r.className = `row ${cls}`.trim();
  const l = document.createElement("span");
  l.textContent = label;
  const v = document.createElement("span");
  v.className = "amount";
  v.textContent = value;
  r.append(l, v);
  return r;
}

function note(text: string): HTMLParagraphElement {
  const p = document.createElement("p");
  p.className = "note";
  p.textContent = text;
  return p;
}

const today = new Date();
el<HTMLInputElement>("hoy").value = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

el("go").addEventListener("click", () => {
  const out = el("out");
  const manual = el<HTMLInputElement>("man").value;
  const res = calcular(
    parseFloat(el<HTMLInputElement>("imp").value),
    parseInt(el<HTMLInputElement>("nf").value, 10) || 1,
    el<HTMLInputElement>("ven").value,
    el<HTMLInputElement>("hoy").value,
    manual === "" ? null : parseFloat(manual),
  );
  out.hidden = false;
  out.replaceChildren();
  if (!res.ok) {
    out.append(note(res.error));
    return;
  }
  window.umami?.track("calcular");
  const principal = res.total - res.interest - res.compensation;
  out.append(row("Principal", eur.format(principal)));
  for (const s of res.segments) {
    out.append(
      row(
        s.rate === null
          ? `${labelSemester(s.key)} · ${s.days} días`
          : `${labelSemester(s.key)} · ${s.days} días al ${pct.format(s.rate)} %`,
        s.rate === null ? "sin tipo" : eur.format(s.interest),
        "sub",
      ),
    );
  }
  out.append(row(`Intereses de demora (${res.days} días)`, eur.format(res.interest)));
  out.append(row("Costes de cobro (40 € por factura)", eur.format(res.compensation)));
  out.append(row("Total reclamable", eur.format(res.total), "total"));
  if (res.missingRates) {
    out.append(note("Faltan tipos legales para algún semestre. Introduce el tipo anual en el campo opcional para incluirlo."));
  }
  if (principal > 0) {
    out.append(note("Con varias facturas, el resultado es una aproximación: para una cifra exacta, calcula cada factura por separado."));
  }
});

const form = el<HTMLFormElement>("waitlist");
const status = el("wl-status");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = new URLSearchParams(
    Array.from(new FormData(form).entries(), ([k, v]) => [k, String(v)]),
  ).toString();
  status.textContent = "Enviando…";
  try {
    const r = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!r.ok) throw new Error(String(r.status));
    window.umami?.track("lista-espera");
    form.reset();
    status.textContent = "Listo, te avisaremos en cuanto esté disponible.";
  } catch {
    status.textContent = "No se pudo guardar tu correo. Inténtalo de nuevo en unos minutos.";
  }
});
