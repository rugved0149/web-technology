const test = require("node:test");
const assert = require("node:assert/strict");
const { getEventDateTime } = require("../utils/eventTime");

test("legacy events with a midnight date use their separate time field", () => {
  const result = getEventDateTime({ date: new Date("2026-10-25T00:00:00.000Z"), time: "14:30" });
  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 9);
  assert.equal(result.getDate(), 25);
  assert.equal(result.getHours(), 14);
  assert.equal(result.getMinutes(), 30);
});

test("new event timestamps keep their stored start time", () => {
  const stored = new Date("2026-10-25T09:00:00.000Z");
  const result = getEventDateTime({ date: stored, time: "14:30" });
  assert.equal(result.getTime(), stored.getTime());
});
