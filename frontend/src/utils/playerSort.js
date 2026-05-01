export function teamNumericPrefix(team) {
  const m = (team || '').trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function compareTeams(aTeam, bTeam) {
  const na = teamNumericPrefix(aTeam);
  const nb = teamNumericPrefix(bTeam);
  if (na != null && nb != null && na !== nb) return na - nb;
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;
  return (aTeam || '').localeCompare(bTeam || '', undefined, { sensitivity: 'base' });
}

/** Price high → low, then team (1s–6s), then name. */
export function sortPlayersForModal(list) {
  return [...list].sort((a, b) => {
    const pa = Number(a.price ?? 0);
    const pb = Number(b.price ?? 0);
    if (pa !== pb) return pb - pa;

    const tc = compareTeams(a.team, b.team);
    if (tc !== 0) return tc;

    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
}
