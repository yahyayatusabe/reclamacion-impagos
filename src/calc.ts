// Tipos legales de demora (Ley 3/2004): tipo BCE + 8 puntos, fijados por semestre.
// Actualizar cada enero y julio con la resolución publicada en el BOE.
export const RATES: Record<string, number> = {
  "2026-1": 10.15,
  "2026-2": 10.4,
};

const DAY = 86_400_000;
const COSTE_COBRO = 40;

export interface Segment {
  key: string;
  days: number;
  rate: number | null;
  interest: number;
}

export type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      segments: Segment[];
      days: number;
      interest: number;
      compensation: number;
      total: number;
      missingRates: boolean;
    };

function parse(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function semester(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() < 6 ? 1 : 2}`;
}

export function labelSemester(key: string): string {
  const [year, half] = key.split("-");
  return `${half === "1" ? "1.er" : "2.º"} semestre ${year}`;
}

export function calcular(
  importe: number,
  facturas: number,
  vencimiento: string,
  hasta: string,
  tipoManual: number | null,
): Result {
  if (!(importe > 0) || !vencimiento || !hasta) {
    return { ok: false, error: "Introduce el importe, la fecha de vencimiento y la fecha de cálculo." };
  }
  const a = parse(vencimiento);
  const b = parse(hasta);
  if (b <= a) {
    return { ok: false, error: "La fecha de cálculo debe ser posterior al vencimiento: todavía no hay mora." };
  }
  if ((b - a) / DAY > 7300) {
    return { ok: false, error: "El periodo supera 20 años; revisa las fechas." };
  }

  const counts = new Map<string, number>();
  for (let t = a + DAY; t <= b; t += DAY) {
    const k = semester(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  let interest = 0;
  let days = 0;
  let missingRates = false;
  const segments: Segment[] = [];
  for (const [key, n] of counts) {
    const rate = tipoManual ?? RATES[key] ?? null;
    days += n;
    if (rate === null) {
      missingRates = true;
      segments.push({ key, days: n, rate: null, interest: 0 });
      continue;
    }
    const i = (importe * (rate / 100) * n) / 365;
    interest += i;
    segments.push({ key, days: n, rate, interest: i });
  }

  const compensation = COSTE_COBRO * Math.max(1, facturas);
  return { ok: true, segments, days, interest, compensation, total: importe + interest + compensation, missingRates };
}
