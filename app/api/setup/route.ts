import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { DEFAULT_CREW } from "@/lib/crew";

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      CREATE TABLE IF NOT EXISTS availability (
        id SERIAL PRIMARY KEY,
        sailor_name TEXT NOT NULL,
        race_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'unknown',
        role TEXT,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(sailor_name, race_date)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS race_notes (
        id SERIAL PRIMARY KEY,
        race_date DATE NOT NULL,
        sailor_name TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS race_results (
        id SERIAL PRIMARY KEY,
        race_date DATE NOT NULL UNIQUE,
        place INTEGER,
        fleet_size INTEGER,
        notes TEXT,
        crew TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS race_overrides (
        id SERIAL PRIMARY KEY,
        race_date DATE NOT NULL UNIQUE,
        status TEXT NOT NULL,
        reason TEXT,
        updated_by TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        event_date DATE NOT NULL,
        event_time TEXT,
        event_type TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        sailor_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unknown',
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, sailor_name)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS crew_members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    // Seed default crew if table is empty
    const existing = await sql`SELECT COUNT(*) as count FROM crew_members`;
    if (Number(existing[0].count) === 0) {
      for (const name of DEFAULT_CREW) {
        await sql`INSERT INTO crew_members (name) VALUES (${name}) ON CONFLICT DO NOTHING`;
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
