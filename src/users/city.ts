/**
 * Canonical form used to compare cities (search filter, availability projection):
 * trimmed, lowercased, accents removed, inner whitespace collapsed.
 * "  São   Paulo " → "sao paulo"
 */
export function normalizeCity(city: string): string {
  return city
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
