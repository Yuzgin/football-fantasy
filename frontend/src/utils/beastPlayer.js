/** Display name "Beast" or full name "Toby Jones" (case-insensitive). */
export function isBeastPlayer(player) {
  if (!player) return false;
  const name = String(player.name ?? '')
    .trim()
    .toLowerCase();
  const full = String(player.full_name ?? '')
    .trim()
    .toLowerCase();
  return name === 'beast' || full === 'toby jones';
}
