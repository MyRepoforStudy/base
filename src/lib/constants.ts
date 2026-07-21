export const ENVIRONMENTS = ["PROD", "STANDBY", "TEST", "DEV"] as const;
export const DATACENTERS = ["MAIN", "DR"] as const;

export function getDistro(os: string | null): string {
  if (!os) return "Unknown";
  const match = os.match(/^([A-Za-z][A-Za-z ]*)/);
  const name = (match ? match[1] : os).trim();
  return name || "Unknown";
}

export function formatUptime(seconds: number | null): string {
  if (seconds === null) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function formatGb(gb: number | null): string {
  if (gb === null) return "—";
  return `${gb.toFixed(1)} GB`;
}

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.length > 0 ? parts.join(" <- caused by: ") : "Unknown error";
}
