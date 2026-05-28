"use server";

import { getDb } from "./db";
import {
  availability,
  crewMembers,
  raceNotes,
  raceResults,
  raceOverrides,
  racePhotos,
  events,
  eventRsvps,
} from "./schema";
import { eq, and, inArray, desc, gte, lte, asc } from "drizzle-orm";
import type { AvailabilityStatus, RaceStatus, EventType } from "./schema";
import { put, del } from "@vercel/blob";
import { DEFAULT_CREW } from "./crew";

// --- Crew ---

export async function getCrewList(): Promise<string[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({ name: crewMembers.name })
      .from(crewMembers)
      .orderBy(asc(crewMembers.id));
    return rows.length > 0 ? rows.map((r) => r.name) : DEFAULT_CREW;
  } catch {
    return DEFAULT_CREW;
  }
}

export async function addCrewMember(name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  try {
    const db = getDb();
    await db.insert(crewMembers).values({ name: trimmed });
    return true;
  } catch {
    return false; // likely duplicate
  }
}

export async function removeCrewMember(name: string) {
  const db = getDb();
  await db.delete(crewMembers).where(eq(crewMembers.name, name));
}

// --- Availability ---

export async function getAvailabilityForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(availability)
    .where(inArray(availability.raceDate, dates));
}

export async function setAvailability(
  sailor: string,
  raceDate: string,
  status: AvailabilityStatus,
  role?: string | null
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.sailorName, sailor),
        eq(availability.raceDate, raceDate)
      )
    );

  if (existing.length > 0) {
    await db
      .update(availability)
      .set({ status, role: role ?? existing[0].role, updatedAt: new Date() })
      .where(
        and(
          eq(availability.sailorName, sailor),
          eq(availability.raceDate, raceDate)
        )
      );
  } else {
    await db.insert(availability).values({
      sailorName: sailor,
      raceDate,
      status,
      role: role ?? null,
    });
  }
}

export async function setBulkAvailability(
  sailor: string,
  dates: string[],
  status: AvailabilityStatus
) {
  for (const date of dates) {
    await setAvailability(sailor, date, status);
  }
}

export async function setRole(
  sailor: string,
  raceDate: string,
  role: string | null
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.sailorName, sailor),
        eq(availability.raceDate, raceDate)
      )
    );

  if (existing.length > 0) {
    await db
      .update(availability)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(availability.sailorName, sailor),
          eq(availability.raceDate, raceDate)
        )
      );
  } else {
    await db.insert(availability).values({
      sailorName: sailor,
      raceDate,
      status: "in",
      role,
    });
  }
}

// --- Race Notes ---

export async function getNotesForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(raceNotes)
    .where(inArray(raceNotes.raceDate, dates))
    .orderBy(desc(raceNotes.createdAt));
}

export async function addNote(
  raceDate: string,
  sailorName: string,
  note: string
) {
  const db = getDb();
  await db.insert(raceNotes).values({ raceDate, sailorName, note });
}

export async function deleteNote(noteId: number) {
  const db = getDb();
  await db.delete(raceNotes).where(eq(raceNotes.id, noteId));
}

// --- Race Overrides ---

export async function getOverridesForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(raceOverrides)
    .where(inArray(raceOverrides.raceDate, dates));
}

export async function setRaceOverride(
  raceDate: string,
  status: RaceStatus,
  reason: string | null,
  updatedBy: string
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(raceOverrides)
    .where(eq(raceOverrides.raceDate, raceDate));

  if (existing.length > 0) {
    await db
      .update(raceOverrides)
      .set({ status, reason, updatedBy, updatedAt: new Date() })
      .where(eq(raceOverrides.raceDate, raceDate));
  } else {
    await db
      .insert(raceOverrides)
      .values({ raceDate, status, reason, updatedBy });
  }
}

export async function clearRaceOverride(raceDate: string) {
  const db = getDb();
  await db.delete(raceOverrides).where(eq(raceOverrides.raceDate, raceDate));
}

// --- Race Results ---

export async function getAllResults() {
  const db = getDb();
  return db
    .select()
    .from(raceResults)
    .orderBy(desc(raceResults.raceDate));
}

export async function getResultsForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(raceResults)
    .where(inArray(raceResults.raceDate, dates));
}

export async function saveResult(
  raceDate: string,
  place: number | null,
  fleetSize: number | null,
  notes: string | null,
  crew: string[] | null
) {
  const db = getDb();
  const crewJson = crew ? JSON.stringify(crew) : null;
  const existing = await db
    .select()
    .from(raceResults)
    .where(eq(raceResults.raceDate, raceDate));

  if (existing.length > 0) {
    await db
      .update(raceResults)
      .set({ place, fleetSize, notes, crew: crewJson })
      .where(eq(raceResults.raceDate, raceDate));
  } else {
    await db
      .insert(raceResults)
      .values({ raceDate, place, fleetSize, notes, crew: crewJson });
  }
}

// --- Custom Events ---

export async function getUpcomingEvents() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  return db
    .select()
    .from(events)
    .where(gte(events.eventDate, today))
    .orderBy(events.eventDate);
}

export async function getAllEvents() {
  const db = getDb();
  return db.select().from(events).orderBy(desc(events.eventDate));
}

export async function createEvent(
  title: string,
  eventDate: string,
  eventTime: string | null,
  eventType: EventType,
  description: string | null,
  createdBy: string
) {
  const db = getDb();
  const result = await db
    .insert(events)
    .values({ title, eventDate, eventTime, eventType, description, createdBy })
    .returning({ id: events.id });
  return result[0].id;
}

export async function updateEvent(
  eventId: number,
  title: string,
  eventDate: string,
  eventTime: string | null,
  eventType: EventType,
  description: string | null
) {
  const db = getDb();
  await db
    .update(events)
    .set({ title, eventDate, eventTime, eventType, description })
    .where(eq(events.id, eventId));
}

export async function deleteEvent(eventId: number) {
  const db = getDb();
  await db.delete(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  await db.delete(events).where(eq(events.id, eventId));
}

export async function getRsvpsForEvents(eventIds: number[]) {
  if (eventIds.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(eventRsvps)
    .where(inArray(eventRsvps.eventId, eventIds));
}

export async function setEventRsvp(
  eventId: number,
  sailor: string,
  status: AvailabilityStatus
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(eventRsvps)
    .where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.sailorName, sailor))
    );

  if (existing.length > 0) {
    await db
      .update(eventRsvps)
      .set({ status, updatedAt: new Date() })
      .where(
        and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.sailorName, sailor))
      );
  } else {
    await db
      .insert(eventRsvps)
      .values({ eventId, sailorName: sailor, status });
  }
}

// --- Past Availability ---

export async function getPastAvailabilityForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(availability)
    .where(inArray(availability.raceDate, dates));
}

// --- Race Photos ---

export async function getPhotosForDates(dates: string[]) {
  if (dates.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(racePhotos)
    .where(inArray(racePhotos.raceDate, dates))
    .orderBy(asc(racePhotos.createdAt));
}

export async function uploadRacePhoto(
  raceDate: string,
  uploadedBy: string,
  file: File,
  caption: string | null
) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `races/${raceDate}/${Date.now()}-${uploadedBy}.${ext}`;
  const blob = await put(filename, file, { access: "public" });

  const db = getDb();
  const result = await db
    .insert(racePhotos)
    .values({ raceDate, uploadedBy, url: blob.url, caption })
    .returning({ id: racePhotos.id });
  return result[0].id;
}

export async function deleteRacePhoto(photoId: number, url: string) {
  const db = getDb();
  await db.delete(racePhotos).where(eq(racePhotos.id, photoId));
  await del(url);
}
