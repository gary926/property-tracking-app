export function formatPrice(
  price: number | null | undefined,
  period: "total" | "month" = "total",
): string {
  if (price === null || price === undefined || isNaN(price)) return "Price TBD";
  // Manual formatting so it renders consistently on web and native Hermes
  // (which lacks full Intl currency data on real devices).
  const rounded = Math.round(price);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = `AED ${withSeparators}`;
  return period === "month" ? `${formatted}/mo` : formatted;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
