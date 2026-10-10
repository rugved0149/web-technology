const escapeIcsText = (value = "") => String(value)
  .replace(/\\/g, "\\\\")
  .replace(/\r?\n/g, "\\n")
  .replace(/,/g, "\\,")
  .replace(/;/g, "\\;");

const toIcsUtc = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const getEventStart = (event) => {
  const storedDate = new Date(event.date);
  if (Number.isNaN(storedDate.getTime())) throw new Error("This event has an invalid date.");

  // Older records stored the date separately from the time at midnight UTC.
  // New records store an actual timestamp, which should be preserved as-is.
  const hasStoredTime = storedDate.getUTCHours() !== 0 || storedDate.getUTCMinutes() !== 0 || storedDate.getUTCSeconds() !== 0;
  if (hasStoredTime) return storedDate;

  const start = new Date(storedDate.getUTCFullYear(), storedDate.getUTCMonth(), storedDate.getUTCDate());
  const time = String(event.time || "").trim();
  const twentyFourHour = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  const twelveHour = time.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);

  if (twentyFourHour) {
    start.setHours(Number(twentyFourHour[1]), Number(twentyFourHour[2]), 0, 0);
  } else if (twelveHour && Number(twelveHour[1]) >= 1 && Number(twelveHour[1]) <= 12) {
    let hours = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === "PM") hours += 12;
    start.setHours(hours, Number(twelveHour[2]), 0, 0);
  }

  return start;
};

export const buildEventCalendar = (event) => {
  const start = getEventStart(event);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const uid = `${event._id || crypto.randomUUID()}@clubsphere`;
  const description = `${event.description || ""}${event.club?.name ? `\nOrganized by: ${event.club.name}` : ""}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClubSphere//Campus Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(event.title || "Campus event")}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(event.venue || "")}`,
    `CATEGORIES:${escapeIcsText(event.category || "Campus")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
};

export const downloadEventCalendar = (event) => {
  const content = buildEventCalendar(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${String(event.title || "campus-event").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campus-event"}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
