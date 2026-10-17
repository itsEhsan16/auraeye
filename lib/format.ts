/** "OCTOBER 17, 2026" */
export function formatAuraDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}
