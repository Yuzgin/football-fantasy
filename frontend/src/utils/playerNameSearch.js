/**
 * Normalize for substring search: lowercase, collapse spaces, strip periods so
 * "g tav" matches "G. Tav" while "g. tav" still matches too.
 */
export function normalizeForPlayerNameSearch(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True if query matches player.name or player.full_name after normalization. */
export function playerMatchesNameSearch(player, queryRaw) {
  const q = normalizeForPlayerNameSearch(queryRaw);
  if (!q) return true;
  const name = normalizeForPlayerNameSearch(player.name || '');
  const fullName = normalizeForPlayerNameSearch(player.full_name || '');
  return name.includes(q) || fullName.includes(q);
}
