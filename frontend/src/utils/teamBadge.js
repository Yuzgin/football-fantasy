/**
 * Map fixture/result team name strings (from the sports API) to badge URLs under /public/badges.
 * Order matters: more specific patterns first.
 */
const RULES = [
  { test: (n) => n.includes("anne lister") || n.includes("annelister"), file: "annelister.png" },
  { test: (n) => n.includes("david kato") || n.includes("davidkato"), file: "davidkato.png" },
  { test: (n) => n.includes("langwith"), file: "langwith.png" },
  { test: (n) => n.includes("vanbrugh"), file: "vanbrugh.jpeg" },
  { test: (n) => n.includes("constantine"), file: "constantine.png" },
  { test: (n) => n.includes("goodricke"), file: "goodricke.png" },
  { test: (n) => n.includes("halifax"), file: "halifax.png" },
  { test: (n) => n.includes("derwent"), file: "derwent.jpeg" },
  { test: (n) => n.includes("alcuin"), file: "alcuin.png" },
  { test: (n) => n.includes("james"), file: "james.jpeg" },
  { test: (n) => n.includes("medic"), file: "medics.png" },
  { test: (n) => n.includes("lister") && !n.includes("anne"), file: "lister.png" },
];

export function normalizeTeamName(name) {
  if (name == null || typeof name !== "string") return "";
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getTeamBadgeUrl(teamName) {
  const n = normalizeTeamName(teamName);
  if (!n) return null;
  for (const { test, file } of RULES) {
    if (test(n)) return `/badges/${file}`;
  }
  return null;
}
