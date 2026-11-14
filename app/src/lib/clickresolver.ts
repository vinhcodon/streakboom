// Tells one click from two (ADR-0109): the first click waits `waitMs`; a second inside that time is a double, and the
// first is not acted on. Pure: the timer is injected so the tests need no clock. The browser has no double click for the
// right button, so the page builds it with this; the left button keeps its own 230 ms timer.

export const RIGHT_DOUBLE_MS = 250;

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface ClickResolver<T> {
  /** A click happened. `payload` is handed back with whichever result comes. */
  click(payload: T): void;
  /** Drop a pending click without acting on it. */
  cancel(): void;
  readonly pending: boolean;
}

export function clickResolver<T>(
  onSingle: (payload: T) => void,
  onDouble: (payload: T) => void,
  timers: Timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) },
  waitMs = RIGHT_DOUBLE_MS,
): ClickResolver<T> {
  let handle: unknown = null;
  let first: T | null = null;
  let waiting = false;
  const clear = () => {
    if (waiting) timers.clear(handle);
    waiting = false;
    handle = null;
    first = null;
  };
  return {
    click(payload) {
      if (waiting) {
        clear();
        onDouble(payload);
        return;
      }
      first = payload;
      waiting = true;
      handle = timers.set(() => {
        const p = first as T;
        waiting = false;
        handle = null;
        first = null;
        onSingle(p);
      }, waitMs);
    },
    cancel: clear,
    get pending() {
      return waiting;
    },
  };
}
