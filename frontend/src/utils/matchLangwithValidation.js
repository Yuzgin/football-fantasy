/**
 * Langwith appears as "Langwith", "Langwith 1" … "Langwith 6", "Langwith 6s", etc.
 * (home team 1 or away team 2).
 */
export function isLangwithTeamName(name) {
  const t = String(name || '').trim().toLowerCase();
  if (t === 'langwith') return true;
  return t.startsWith('langwith ');
}

/**
 * @returns {{ ok: true, langwithGoals: number } | { ok: false, error: string }}
 */
export function resolveLangwithGoals(team1, team2, team1ScoreRaw, team2ScoreRaw) {
  const home = isLangwithTeamName(team1);
  const away = isLangwithTeamName(team2);
  if (home && away) {
    return { ok: false, error: 'Only one side can be a Langwith team name.' };
  }
  if (!home && !away) {
    return {
      ok: false,
      error:
        'One team must be Langwith (e.g. "Langwith", "Langwith 6s", or "Langwith 1"–"Langwith 6").',
    };
  }

  const g1 = parseInt(String(team1ScoreRaw).trim(), 10);
  const g2 = parseInt(String(team2ScoreRaw).trim(), 10);
  if (Number.isNaN(g1) || Number.isNaN(g2)) {
    return { ok: false, error: 'Enter a valid score for both teams (whole numbers).' };
  }

  const langwithGoals = home ? g1 : g2;
  return { ok: true, langwithGoals };
}

export function getSubmittedPlayerStatRows(playersStats) {
  return playersStats.filter((s) => s.player !== '' && s.player != null);
}

/**
 * Client-side checks before POST /api/matches/
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateMatchBeforeCreate({
  team1,
  team2,
  team1_score,
  team2_score,
  playersStats,
}) {
  const lang = resolveLangwithGoals(team1, team2, team1_score, team2_score);
  if (!lang.ok) return lang;

  const submitted = getSubmittedPlayerStatRows(playersStats);
  const totalGoals = submitted.reduce((acc, s) => acc + (parseInt(s.goals, 10) || 0), 0);
  if (totalGoals !== lang.langwithGoals) {
    return {
      ok: false,
      error: `Total goals across selected players (${totalGoals}) must equal Langwith's goals (${lang.langwithGoals}). Adjust rows or the Langwith score.`,
    };
  }

  const motmSum = submitted.reduce((acc, s) => acc + (parseInt(s.MOTM, 10) || 0), 0);
  if (motmSum !== 1) {
    if (motmSum === 0) {
      return {
        ok: false,
        error:
          'Pick exactly one Man of the Match: set MOTM to 1 on one player and leave MOTM at 0 for everyone else.',
      };
    }
    return {
      ok: false,
      error: `Exactly one Man of the Match allowed (MOTM should total 1; currently ${motmSum}).`,
    };
  }

  return { ok: true };
}
