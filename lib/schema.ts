import { pgTable, serial, text, date, timestamp, integer, unique } from "drizzle-orm/pg-core";

export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availability = pgTable(
  "availability",
  {
    id: serial("id").primaryKey(),
    sailorName: text("sailor_name").notNull(),
    raceDate: date("race_date").notNull(),
    status: text("status").notNull().default("unknown"),
    role: text("role"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique().on(table.sailorName, table.raceDate)]
);

export const raceNotes = pgTable("race_notes", {
  id: serial("id").primaryKey(),
  raceDate: date("race_date").notNull(),
  sailorName: text("sailor_name").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const raceResults = pgTable("race_results", {
  id: serial("id").primaryKey(),
  raceDate: date("race_date").notNull().unique(),
  place: integer("place"),
  fleetSize: integer("fleet_size"),
  notes: text("notes"),
  crew: text("crew"), // JSON array of player names who played
  resultsUrl: text("results_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game-level overrides: cancelled, rained out, special status
export const raceOverrides = pgTable("race_overrides", {
  id: serial("id").primaryKey(),
  raceDate: date("race_date").notNull().unique(),
  status: text("status").notNull(), // "cancelled", "no_race", "custom"
  reason: text("reason"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom events (non-game): practice, social, etc.
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  eventDate: date("event_date").notNull(),
  eventTime: text("event_time"),
  eventType: text("event_type").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Photos for completed games
export const racePhotos = pgTable("race_photos", {
  id: serial("id").primaryKey(),
  raceDate: date("race_date").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RSVP for custom events
export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    sailorName: text("sailor_name").notNull(),
    status: text("status").notNull().default("unknown"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique().on(table.eventId, table.sailorName)]
);

export type Availability = typeof availability.$inferSelect;
export type AvailabilityStatus = "in" | "out" | "maybe" | "unknown";
export type RaceNote = typeof raceNotes.$inferSelect;
export type RaceResult = typeof raceResults.$inferSelect;
export type RaceOverride = typeof raceOverrides.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type RacePhoto = typeof racePhotos.$inferSelect;

export const RACE_STATUSES = [
  { value: "cancelled", label: "Cancelled", color: "red" },
  { value: "no_race", label: "No Game", color: "muted" },
  { value: "custom", label: "Custom Note", color: "amber" },
] as const;
export type RaceStatus = (typeof RACE_STATUSES)[number]["value"];

export const ROLES = [
  "Setter",
  "Outside Hitter",
  "Middle Blocker",
  "Libero",
  "Opposite Hitter",
  "Any",
] as const;
export type Role = (typeof ROLES)[number];

export const EVENT_TYPES = [
  { value: "prep", label: "Prep", emoji: "🔧" },
  { value: "race", label: "Game", emoji: "🏐" },
  { value: "practice", label: "Practice", emoji: "🏁" },
  { value: "social", label: "Social", emoji: "🍻" },
  { value: "other", label: "Other", emoji: "📌" },
] as const;
export type EventType = (typeof EVENT_TYPES)[number]["value"];
