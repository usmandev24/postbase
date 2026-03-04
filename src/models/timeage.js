const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always", style: "long" });

export function toRelativeTime(date) {
  const diffMs = date - new Date();
  const units = [
    { limit: 60 , name: "minute" },
    { limit: 60 * 60 , name: "hour" },
    { limit: 60 * 60 * 24 , name: "day" },
    { limit: 60 * 60 * 24 * 7, name: "week" },
    { limit: 60 * 60 * 24 * 30, name: "month" },
    { limit: 60 * 60 * 24 * 365, name: "year" }
  ];

  const seconds = Math.round(diffMs / 1000);
  for (let i = units.length - 1; i >= 0; i--) {
    const unitSeconds = units[i].limit;
    const value = Math.round(seconds / unitSeconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, units[i].name);
    }
  }
  return rtf.format(seconds, "second");
}
