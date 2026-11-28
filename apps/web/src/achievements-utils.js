export function calculateBadgePercentage(progress, target) {
  const safeProgress = Math.max(0, Number(progress) || 0);
  const safeTarget = Math.max(1, Number(target) || 1);
  return Math.min(100, Math.round((safeProgress / safeTarget) * 100));
}
