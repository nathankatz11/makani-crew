// Chicago Beer Can Series 2026 — exact schedule
// Based on chicagobeercan.org schedule pattern, mapped to 2026 Wednesdays
// Reference: https://www.chicagobeercan.org

export interface SeasonDate {
  date: string;
  label: string;
  isRace: boolean; // false for breaks, parties, ceremonies
}

// The full 2026 season schedule
const SEASON_SCHEDULE: SeasonDate[] = [
  { date: "2026-05-06", label: "Beer Can Starting Gun Party", isRace: false },
  { date: "2026-05-13", label: "Tune-Up Race", isRace: true },
  { date: "2026-05-20", label: "Race Week 1", isRace: true },
  { date: "2026-05-27", label: "Race Week 2", isRace: true },
  { date: "2026-06-03", label: "Race Week 3", isRace: true },
  { date: "2026-06-10", label: "Race Week 4", isRace: true },
  { date: "2026-06-17", label: "Race Week 5", isRace: true },
  { date: "2026-06-24", label: "Race Week 6", isRace: true },
  { date: "2026-07-01", label: "Race Week 7", isRace: true },
  { date: "2026-07-08", label: "Break — Mac Race", isRace: false },
  { date: "2026-07-15", label: "Break — Mac Race", isRace: false },
  { date: "2026-07-22", label: "Race Week 8", isRace: true },
  { date: "2026-07-29", label: "Race Week 9", isRace: true },
  { date: "2026-08-05", label: "100 Boats on a Beer Can", isRace: true },
  { date: "2026-08-12", label: "Race Week 10", isRace: true },
  { date: "2026-08-19", label: "Race Week 11", isRace: true },
  { date: "2026-08-26", label: "Race Week 12", isRace: true },
  { date: "2026-09-02", label: "Race Week 13", isRace: true },
  { date: "2026-09-09", label: "Race Week 14", isRace: true },
  { date: "2026-10-07", label: "Beer Can Bash Awards Ceremony", isRace: false },
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

export function getUpcomingWednesdays(count?: number): string[] {
  const raceDates = getRaceDatesOnly();
  const now = new Date();
  const today = formatDate(now);

  const isWednesday = now.getDay() === 3;
  const cutoff =
    isWednesday && now.getHours() < 20
      ? today
      : formatDate(new Date(now.getTime() + 86400000));

  const upcoming = raceDates.filter((d) => d >= cutoff);
  return count ? upcoming.slice(0, count) : upcoming;
}

export function getUpcomingFullSchedule(): SeasonDate[] {
  const now = new Date();
  const today = formatDate(now);

  const isWednesday = now.getDay() === 3;
  const cutoff =
    isWednesday && now.getHours() < 20
      ? today
      : formatDate(new Date(now.getTime() + 86400000));

  return SEASON_SCHEDULE.filter((d) => d.date >= cutoff);
}

export function getPastRaceDates(): string[] {
  const raceDates = getRaceDatesOnly();
  const now = new Date();
  const today = formatDate(now);
  // Include today once the race has started (6pm+)
  const cutoff = now.getDay() === 3 && now.getHours() >= 18 ? today : formatDate(new Date(now.getTime() - 86400000));
  return raceDates.filter((d) => d <= cutoff);
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
