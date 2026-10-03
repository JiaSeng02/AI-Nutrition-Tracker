export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayISOString(): string {
  return formatDateToISO(new Date());
}

export function formatLocalTimestamp(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${formatDateToISO(date)}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(dateStr: string): string {
  const todayStr = getTodayISOString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToISO(yesterday);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateToISO(tomorrow);

  const targetDate = parseISODate(dateStr);
  const dayName = targetDate.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = targetDate.toLocaleDateString("en-US", { month: "short" });
  const dayNumber = targetDate.getDate();

  if (dateStr === todayStr) {
    return `Today, ${dayNumber} ${monthName}`;
  }
  if (dateStr === yesterdayStr) {
    return `Yesterday, ${dayNumber} ${monthName}`;
  }
  if (dateStr === tomorrowStr) {
    return `Tomorrow, ${dayNumber} ${monthName}`;
  }

  return `${dayName}, ${dayNumber} ${monthName}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export interface DayItem {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
}

export function getDayItemsAround(
  centerDate: Date,
  daysBefore = 3,
  daysAfter = 3,
): DayItem[] {
  const items: DayItem[] = [];
  const todayStr = getTodayISOString();

  for (let offset = -daysBefore; offset <= daysAfter; offset++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + offset);
    const dateStr = formatDateToISO(d);

    items.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      isToday: dateStr === todayStr,
    });
  }

  return items;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function formatTime(isoOrTimestamp: string): string {
  try {
    // New format: local datetime without timezone suffix, e.g. "2026-10-03T16:30:00.000"
    // Parse the time part directly to avoid any JS Date UTC interpretation.
    const hasTimezone =
      isoOrTimestamp.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoOrTimestamp);

    if (!hasTimezone && isoOrTimestamp.includes("T")) {
      const timePart = isoOrTimestamp.split("T")[1]; // e.g. "16:30:00.000"
      if (!timePart) return "";
      const [hourStr, minuteStr] = timePart.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (isNaN(hour) || isNaN(minute)) return "";
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
    }

    // Legacy format: includes Z or offset — use Date constructor (UTC-aware path)
    const d = new Date(isoOrTimestamp);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}
