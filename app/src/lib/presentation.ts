// The presentation state of the chat (#18): a pet's line is written into the talk when the model answers (the next pet of the same turn hears it), but it is
// shown in the chat only when it is presented, on the beat of Peak's expression. When a turn is cancelled or replaced, every line still waiting is dropped from
// the talk at once, before any new turn builds what the pets hear; a late callback of the old turn then finds nothing and changes nothing.
import { withoutTurn, type Room } from "./conversation.ts";
import type { PetId } from "./duo.ts";

export class Presenter {
  /** The generation of the current turn: a queued step of an older one is stale. */
  gen = 0;
  private waiting = new Map<number, { pet: PetId; gen: number }>();

  /** A line was written into the talk and waits to be presented. */
  written(turnId: number, pet: PetId): void {
    this.waiting.set(turnId, { pet, gen: this.gen });
  }

  /** A turn is cancelled or replaced: the generation moves on and every waiting line leaves the talk now. Returns the room without them. */
  cancel(room: Room): Room {
    this.gen++;
    let r = room;
    for (const id of this.waiting.keys()) r = withoutTurn(r, id);
    this.waiting.clear();
    return r;
  }

  /** The presentation of a line queued at `gen`: true (and it is no longer waiting) when it may be shown now; false for a stale or dropped one. */
  present(turnId: number, gen: number): boolean {
    const w = this.waiting.get(turnId);
    if (!w || gen !== this.gen || w.gen !== gen) return false;
    this.waiting.delete(turnId);
    return true;
  }

  /** A waiting line that will not be presented for its own reason (Quiet came): it leaves the talk. False if it was not waiting (already dropped). */
  drop(room: Room, turnId: number): { room: Room; dropped: boolean } {
    if (!this.waiting.delete(turnId)) return { room, dropped: false };
    return { room: withoutTurn(room, turnId), dropped: true };
  }

  /** The turns hidden from the chat, and the pet shown as writing (the first that waits), or null. */
  hidden(): Set<number> { return new Set(this.waiting.keys()); }
  writer(): PetId | null { const f = this.waiting.values().next(); return f.done ? null : f.value.pet; }
}
