import { differenceInDays, parseISO } from "date-fns";

/** Detects whether a reschedule shifts the parent timeline */
export function detectShift(opts: {
  oldStart: string | null;
  oldEnd: string | null;
  newStart: string | null;
  newEnd: string | null;
}) {
  const { oldStart, oldEnd, newStart, newEnd } = opts;
  const startDelta =
    oldStart && newStart ? differenceInDays(parseISO(newStart), parseISO(oldStart)) : 0;
  const endDelta = oldEnd && newEnd ? differenceInDays(parseISO(newEnd), parseISO(oldEnd)) : 0;
  const shifted = startDelta !== 0 || endDelta !== 0;
  return { shifted, startDelta, endDelta };
}

export function fmtDelta(d: number) {
  if (d === 0) return "no change";
  return d > 0 ? `+${d}d` : `${d}d`;
}
