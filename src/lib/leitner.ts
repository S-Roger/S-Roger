const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

const MAX_BOX = 5;
const MIN_BOX = 1;

export function nextBoxOnCorrect(currentBox: number): number {
  return Math.min(currentBox + 1, MAX_BOX);
}

export function nextBoxOnWrong(): number {
  return MIN_BOX;
}

export function computeNextReviewAt(box: number, from: Date = new Date()): Date {
  const days = BOX_INTERVAL_DAYS[box] ?? 0;
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}
