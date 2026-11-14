// Being told to go away in the middle of a chat is not the same as being told to go away (ADR-0108).
//
// The same words, "lượn đi", "cút đi", mean two things. Typed when the person has not talked with Peak for a while, they are an
// order. Typed in the middle of a back-and-forth they are a joke, a tease, a reply in the game. So the page asks a plain question
// before it acts: is there a conversation going on?
//   - No: the command is real, Peak says goodbye and leaves, as before.
//   - Yes: it does not leave. The words go to the chat like any message and Peak answers in character (no needy line: charter
//     article 5). But if the person says it again and again (INSIST_COUNT times within INSIST_WINDOW_MS), they mean it, and Peak
//     goes: "Yield first" (manners) and the person's attention is theirs.
// Pure: the page keeps the time of the last message and the state; nothing here is saved or counted aloud.

/** A conversation is going on when the person's last chat message was sent less than this long ago. */
export const BANTER_WINDOW_MS = 120_000;
/** This many dismissals inside the window below, in a conversation, are an order. */
export const INSIST_COUNT = 3;
export const INSIST_WINDOW_MS = 180_000;

export interface DismissalState {
  /** When the dismissals made in a conversation were typed (newest last, only those inside the window). */
  times: number[];
}

export const freshDismissalState = (): DismissalState => ({ times: [] });

/** Is there a conversation going on at `now`? `lastChatAt` is when the person last sent a chat message (null: never in this run). */
export function inConversation(now: number, lastChatAt: number | null): boolean {
  return lastChatAt !== null && now >= lastChatAt && now - lastChatAt < BANTER_WINDOW_MS;
}

export interface DismissalDecision {
  /** `leave`: act on it. `chat`: send the words to the chat as a message. */
  action: "leave" | "chat";
  state: DismissalState;
}

/** The person typed a dismissal at `now`. Should Peak leave, or answer it as chat? */
export function decideDismissal(now: number, lastChatAt: number | null, state: DismissalState): DismissalDecision {
  if (!inConversation(now, lastChatAt)) return { action: "leave", state: freshDismissalState() };
  const times = [...state.times.filter((t) => now - t < INSIST_WINDOW_MS && t <= now), now];
  if (times.length >= INSIST_COUNT) return { action: "leave", state: freshDismissalState() };
  return { action: "chat", state: { times } };
}
