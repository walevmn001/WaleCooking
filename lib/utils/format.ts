/** Định dạng thời lượng (phút) sang chuỗi tiếng Việt. */
export function formatMinutes(minutes: number | undefined | null): string {
  if (minutes === undefined || minutes === null || !Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} giờ`);
  if (m > 0) parts.push(`${m} phút`);
  return parts.length > 0 ? parts.join(" ") : "0 phút";
}

/** Định dạng số khẩu phần. */
export function formatServings(servings: number | undefined | null): string {
  if (!servings || servings <= 0) return "—";
  return `${servings} khẩu phần`;
}
