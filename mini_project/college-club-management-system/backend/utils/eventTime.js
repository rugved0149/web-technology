const getEventDateTime = (event) => {
  const storedDate = new Date(event.date);
  if (Number.isNaN(storedDate.getTime())) return storedDate;

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

module.exports = { getEventDateTime };
