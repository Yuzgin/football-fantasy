export function formatFixtureTime(time) {
  if (time == null) return "—";
  if (typeof time === "string") return time.length >= 5 ? time.slice(0, 5) : time;
  return String(time);
}
