export function money(n: number | null | undefined, currency = "ج.م"): string {
  if (n === null || n === undefined) return "—";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(n)
  )} ${currency}`;
}

export function roasText(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(2)}×`;
}

export function arDate(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}
