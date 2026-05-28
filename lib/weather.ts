// Open-Meteo API — free, no API key needed
// DuSable Harbor, Chicago: 41.8867° N, 87.6108° W

export interface WeatherForecast {
  temp: number; // °F
  wind: number; // knots
  windDir: string; // cardinal direction
  gusts: number; // knots
  desc: string;
  sunset: string; // "7:42 PM"
}

const WIND_DIRS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function degreesToCardinal(deg: number): string {
  const idx = Math.round(deg / 22.5) % 16;
  return WIND_DIRS[idx];
}

export async function getWednesdayWeather(
  dateStr: string
): Promise<WeatherForecast | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=41.8867&longitude=-87.6108` +
        `&daily=temperature_2m_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,weather_code,sunset` +
        `&temperature_unit=fahrenheit&wind_speed_unit=kn&timezone=America/Chicago` +
        `&start_date=${dateStr}&end_date=${dateStr}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const d = data.daily;
    const temp = Math.round(d.temperature_2m_max[0]);
    const wind = Math.round(d.wind_speed_10m_max[0]);
    const gusts = Math.round(d.wind_gusts_10m_max[0]);
    const windDir = degreesToCardinal(d.wind_direction_10m_dominant[0]);
    const code = d.weather_code[0];

    // Open-Meteo returns sunset already in the requested timezone (America/Chicago),
    // so parse the time directly from the string to avoid UTC double-conversion.
    const sunsetRaw = d.sunset[0] as string; // e.g. "2026-06-10T20:23"
    const timePart = sunsetRaw.split("T")[1] ?? "00:00";
    const [hourStr, minStr] = timePart.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const sunset = `${h12}:${minStr} ${ampm}`;

    return { temp, wind, windDir, gusts, desc: weatherCodeToDesc(code), sunset };
  } catch {
    return null;
  }
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}
