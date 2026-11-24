// The chat's send queue (#19): a message sent while another one is being handled waits, shows as "waiting", and goes after it, in the order sent. "Being
// handled" lasts until the dispatch has settled AND the answers it produced have been presented, so a waiting message never replaces an answer the person has
// not seen yet. Early returns (a cap line, a command, an offline line) settle like any other dispatch, so the next message always goes.

export interface Waiting { id: number; text: string; at: number }

export class SendQueue {
  private q: Waiting[] = [];
  private running = false;
  private nextId = -1;

  /** `dispatch` handles one message; `presented` resolves once every answer it produced has been presented; `changed` is told when the waiting list changes. */
  private dispatch: (text: string) => Promise<unknown>;
  private presented: () => Promise<void>;
  private changed: () => void;
  constructor(dispatch: (text: string) => Promise<unknown>, presented: () => Promise<void>, changed: () => void = () => {}) {
    this.dispatch = dispatch;
    this.presented = presented;
    this.changed = changed;
  }

  /** The messages waiting, oldest first. */
  waiting(): readonly Waiting[] { return this.q; }

  /** A message from the person: handled now if nothing is being handled, else it waits behind the others. */
  send(text: string, now: number): "now" | "queued" {
    if (this.running) {
      this.q.push({ id: this.nextId--, text, at: now });
      this.changed();
      return "queued";
    }
    this.running = true; // set before any await: a message that arrives during the first step already queues behind this one
    void this.pump(text);
    return "now";
  }

  /** The waiting messages are given back (the chat visit was dismissed): they are not sent; the caller returns their text to the person. */
  takeAll(): string[] {
    const t = this.q.map((w) => w.text);
    this.q = [];
    this.changed();
    return t;
  }

  private async pump(first: string): Promise<void> {
    let text: string | undefined = first;
    while (text !== undefined) {
      try { await this.dispatch(text); } catch { /* a failed dispatch still lets the next message go */ }
      try { await this.presented(); } catch { /* idem */ }
      const next = this.q.shift();
      if (next) this.changed();
      text = next?.text;
    }
    this.running = false;
  }
}
