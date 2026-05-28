"use server";

import { getDb } from "./db";
import {
  availability,
  crewMembers,
  raceNotes,
  raceResults,
  raceOverrides,
  racePhotos,
} from "./schema";
import { eq, and, inArray, desc, gte, asc } from "drizzle-orm";
import type { AvailabilityStatus, RaceStatus } from "./schema";
import { put, del, head } from "@vercel/blob";
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

export async function editNote(noteId: number, note: string) {
  const db = getDb();
  await db.update(raceNotes).set({ note }).where(eq(raceNotes.id, noteId));
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
  crew: string[] | null,
  resultsUrl: string | null
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
      .set({ place, fleetSize, notes, crew: crewJson, resultsUrl })
      .where(eq(raceResults.raceDate, raceDate));
  } else {
    await db
      .insert(raceResults)
      .values({ raceDate, place, fleetSize, notes, crew: crewJson, resultsUrl });
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
  formData: FormData,
  caption: string | null
): Promise<{ error?: string; id?: number }> {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  try {
    const filename = `races/${raceDate}/${Date.now()}-${uploadedBy}.jpg`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    console.log("Blob token present:", !!token, "| File size:", file.size, "| File type:", file.type);
    const blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: true,
      token,
    });
    const db = getDb();
    const result = await db
      .insert(racePhotos)
      .values({ raceDate, uploadedBy, url: blob.url, caption })
      .returning({ id: racePhotos.id });
    return { id: result[0].id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Photo upload error (full):", message);
    return { error: `Upload failed: ${message}` };
  }
}

export async function deleteRacePhoto(photoId: number, url: string) {
  const db = getDb();
  await db.delete(racePhotos).where(eq(racePhotos.id, photoId));
  await del(url);
}
