/** @param {string|Date} raw */
export function dayKeyFromMatch(raw) {
  if (raw == null) return "";
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const d = new Date(raw);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** @param {string} isoDateKey YYYY-MM-DD */
export function formatScheduleDayLabel(isoDateKey) {
  const [y, m, d] = isoDateKey.split("-").map(Number);
  if (!y || !m || !d) return isoDateKey;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((target - t0) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const nowY = today.getFullYear();
  return target.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(y !== nowY ? { year: "numeric" } : {}),
  });
}

/**
 * @param {object[]} matches
 * @param {{ groupOrder?: 'asc'|'desc', compareWithinGroup?: (a: object, b: object) => number }} opts
 */
export function groupMatchesByDay(matches, opts = {}) {
  const { groupOrder = "asc", compareWithinGroup } = opts;
  const map = new Map();
  for (const m of matches) {
    const key = dayKeyFromMatch(m.date);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  let keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  if (groupOrder === "desc") keys = keys.reverse();
  return keys.map((dateKey) => {
    let rowMatches = map.get(dateKey);
    if (compareWithinGroup) {
      rowMatches = [...rowMatches].sort(compareWithinGroup);
    }
    return {
      dateKey,
      label: formatScheduleDayLabel(dateKey),
      matches: rowMatches,
    };
  });
}

export function compareByFixtureTime(a, b) {
  const ta = a.time != null ? String(a.time) : "";
  const tb = b.time != null ? String(b.time) : "";
  return ta.localeCompare(tb);
}

export function compareByResultDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}
