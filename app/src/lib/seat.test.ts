import { test } from "node:test";
import assert from "node:assert/strict";
import { AT_SEAT_PX, DEFAULT_SEAT, MIN_SEAT_ROOM_PX, parseSeat, seatFraction, seatMove, seatWalkMs } from "./seat.ts";

test("where Peak stands along the floor is the room on its left over the whole room", () => {
  assert.equal(seatFraction(0, 1000), 0);
  assert.equal(seatFraction(1000, 0), 1);
  assert.equal(seatFraction(250, 750), 0.25);
  assert.equal(seatFraction(10, 20), null, "no room to tell");
  assert.equal(seatFraction(NaN, 500), null);
  assert.ok(seatFraction(MIN_SEAT_ROOM_PX / 2, MIN_SEAT_ROOM_PX / 2) !== null);
});

test("a stored place is a number from 0 to 1, anything else is not taught", () => {
  assert.equal(parseSeat(0.4), 0.4);
  assert.equal(parseSeat(0), 0);
  for (const bad of [-0.1, 1.2, "0.5", null, undefined, NaN, {}]) assert.equal(parseSeat(bad), null, String(bad));
});

test("the way home: toward the taught place, or the default one, or nowhere when already there", () => {
  // 1000 px of room in all: Peak at 0.25 of the floor
  assert.deepEqual(seatMove(250, 750, 0.75), { dir: 1, px: 500 });
  assert.deepEqual(seatMove(750, 250, 0.25), { dir: -1, px: 500 });
  const toDefault = seatMove(100, 900, null)!;
  assert.equal(toDefault.dir, 1);
  assert.equal(Math.round(toDefault.px), Math.round((DEFAULT_SEAT - 0.1) * 1000));
  assert.equal(seatMove(900, 100, 0.9), null, "already there");
  assert.equal(seatMove(900 - AT_SEAT_PX / 2, 100 + AT_SEAT_PX / 2, 0.9), null, "close enough");
  assert.equal(seatMove(10, 20, 0.5), null, "no room");
});

test("a place outside 0..1 is held to the ends of the floor", () => {
  assert.deepEqual(seatMove(500, 500, 3 as number), { dir: 1, px: 500 });
  assert.deepEqual(seatMove(500, 500, -3 as number), { dir: -1, px: 500 });
});

test("a walk is given half as long again as it needs, and a little more", () => {
  assert.equal(seatWalkMs(110, 110), 4000);
  assert.ok(seatWalkMs(1000, 110) > (1000 / 110) * 1000);
});
