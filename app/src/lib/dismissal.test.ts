import test from "node:test";
import assert from "node:assert/strict";
import { BANTER_WINDOW_MS, INSIST_COUNT, INSIST_WINDOW_MS, decideDismissal, freshDismissalState, inConversation } from "./dismissal.ts";

const S = 1000;

test("with no talk for a while, or none at all, a dismissal is an order", () => {
  assert.equal(decideDismissal(1_000_000, null, freshDismissalState()).action, "leave");
  assert.equal(decideDismissal(1_000_000, 1_000_000 - BANTER_WINDOW_MS, freshDismissalState()).action, "leave", "exactly at the limit is no longer a conversation");
  assert.equal(decideDismissal(1_000_000, 1_000_000 - 10 * 60 * S, freshDismissalState()).action, "leave");
});

test("in the middle of a conversation the first and the second dismissal are answered as chat", () => {
  const now = 1_000_000;
  const last = now - 20 * S;
  const a = decideDismissal(now, last, freshDismissalState());
  assert.equal(a.action, "chat");
  const b = decideDismissal(now + 15 * S, now + 10 * S, a.state);
  assert.equal(b.action, "chat");
  assert.equal(b.state.times.length, 2);
});

test("the third dismissal inside the window is an order, and it starts the count again", () => {
  let st = freshDismissalState();
  let t = 5_000_000;
  let last = t - 10 * S;
  const actions: string[] = [];
  for (let i = 0; i < INSIST_COUNT; i++) {
    const d = decideDismissal(t, last, st);
    actions.push(d.action);
    st = d.state;
    last = t; // each one is also sent as a chat message
    t += 30 * S;
  }
  assert.deepEqual(actions, ["chat", "chat", "leave"]);
  assert.deepEqual(st.times, []);
});

test("dismissals spread too far apart do not add up", () => {
  let st = freshDismissalState();
  let t = 9_000_000;
  for (let i = 0; i < 6; i++) {
    const d = decideDismissal(t, t - 5 * S, st);
    assert.equal(d.action, "chat", `${i}`);
    st = d.state;
    t += INSIST_WINDOW_MS - 1; // each one sees only itself and at most one before it
    st = { times: st.times };
  }
  assert.ok(st.times.length <= 2);
});

test("a long silence in between turns the next dismissal into an order even if earlier ones were made", () => {
  const d1 = decideDismissal(1_000_000, 990_000, freshDismissalState());
  assert.equal(d1.action, "chat");
  const d2 = decideDismissal(1_000_000 + 10 * 60 * S, 1_000_000 + 5 * S, d1.state);
  assert.equal(d2.action, "leave");
});

test("a clock that went backwards is not a conversation", () => {
  assert.equal(inConversation(100, 5000), false);
  assert.equal(inConversation(5000, 4999), true);
  assert.equal(inConversation(5000, null), false);
});
