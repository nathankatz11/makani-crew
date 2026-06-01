// Sunday Volleyball 2026 — 8 Sundays, June 7 through July 26

export interface SeasonDate {
  date: string;
  label: string;
  isRace: boolean; // false for breaks or special events
}

const SEASON_SCHEDULE: SeasonDate[] = [
  { date: "2026-06-07", label: "Game 1", isRace: true },
  { date: "2026-06-14", label: "Game 2", isRace: true },
  { date: "2026-06-21", label: "Game 3", isRace: true },
  { date: "2026-06-28", label: "Game 4", isRace: true },
  { date: "2026-07-05", label: "Game 5", isRace: true },
  { date: "2026-07-12", label: "Game 6", isRace: true },
  { date: "2026-07-19", label: "Game 7", isRace: true },
  { date: "2026-07-26", label: "Game 8", isRace: true },
];

export function getFullSchedule(): SeasonDate[] {
  return SEASON_SCHEDULE;
}

export function getRaceDatesOnly(): string[] {
  return SEASON_SCHEDULE.filter((d) => d.isRace).map((d) => d.date);
}

export function getAllSeasonDates(): string[] {
  return SEASON_SCHEDULE.map((d) => d.date);
}

export function getSeasonDateInfo(dateStr: string): SeasonDate | undefined {
  return SEASON_SCHEDULE.find((d) => d.date === dateStr);
}

// Returns current day-of-week and hour in Chicago time (CST/CDT)
function getChicagoNow(): { day: number; hour: number; today: string } {
  const now = new Date();
  const chicago = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => chicago.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(get("weekday"));
  const hour = parseInt(get("hour"), 10);
  const today = `${get("year")}-${get("month")}-${get("day")}`;
  return { day, hour, today };
}

export function getUpcomingSundays(count?: number): string[] {
  const gameDates = getRaceDatesOnly();
  const { day, hour, today } = getChicagoNow();
  const isSunday = day === 0;
  const cutoff = isSunday && hour < 10
    ? today
    : formatDate(new Date(new Date().getTime() + 86400000));
  const upcoming = gameDates.filter((d) => d >= cutoff);
  return count ? upcoming.slice(0, count) : upcoming;
}

export function getUpcomingFullSchedule(): SeasonDate[] {
  const { day, hour, today } = getChicagoNow();
  const isSunday = day === 0;
  const cutoff = isSunday && hour < 10
    ? today
    : formatDate(new Date(new Date().getTime() + 86400000));
  return SEASON_SCHEDULE.filter((d) => d.date >= cutoff);
}

export function getPastRaceDates(): string[] {
  const gameDates = getRaceDatesOnly();
  const { day, hour, today } = getChicagoNow();
  const isSunday = day === 0;
  const cutoff = isSunday && hour >= 10
    ? today
    : formatDate(new Date(new Date().getTime() - 86400000));
  return gameDates.filter((d) => d <= cutoff);
}

export function getMostRecentRaceDate(): string | null {
  const past = getPastRaceDates();
  return past.length > 0 ? past[past.length - 1] : null;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return date.toISOString().split("T")[0];
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}
