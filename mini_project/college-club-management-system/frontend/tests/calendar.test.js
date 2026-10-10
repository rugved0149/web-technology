import test from "node:test";
import assert from "node:assert/strict";
import { buildEventCalendar, getEventStart } from "../src/utils/calendar.js";

test("calendar invitations escape text and include event details", () => {
  const calendar = buildEventCalendar({
    _id: "event-1",
    title: "Open House, Spring",
    description: "Bring a laptop; entry is free.\nUse the side gate.",
    date: "2026-10-25T00:00:00.000Z",
    time: "14:30",
    venue: "Main Hall, Block A",
    category: "Technology",
    club: { name: "Tech Club" },
  });

  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.match(calendar, /SUMMARY:Open House\\, Spring/);
  assert.match(calendar, /LOCATION:Main Hall\\, Block A/);
  assert.ok(calendar.includes("DESCRIPTION:Bring a laptop\\; entry is free.\\nUse the side gate.\\nOrganized by: Tech Club"));
  assert.match(calendar, /DTSTART:\d{8}T\d{6}Z/);
  assert.match(calendar, /END:VCALENDAR/);
});

test("legacy events combine the stored date with the separate time field", () => {
  const start = getEventStart({ date: "2026-10-25T00:00:00.000Z", time: "14:30" });
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 9);
  assert.equal(start.getDate(), 25);
  assert.equal(start.getHours(), 14);
  assert.equal(start.getMinutes(), 30);
});

test("new event timestamps preserve the start instant", () => {
  const date = "2026-10-25T09:00:00.000Z";
  assert.equal(getEventStart({ date, time: "14:30" }).toISOString(), date);
});
