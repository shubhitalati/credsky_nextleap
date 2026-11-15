import { NextRequest, NextResponse } from "next/server";

const WEATHER_ENDPOINT = "https://api.weatherapi.com/v1/current.json";

function isValidQuery(q: string) {
  const coords = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
  const city = /^[\p{L}\p{M}0-9\s.',-]{1,80}$/u;
  return coords.test(q) || city.test(q);
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.WEATHERAPI_KEY;
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather service is not configured." },
      { status: 500 }
    );
  }

  if (!q) {
    return NextResponse.json(
      { error: "Enter a city name to search." },
      { status: 400 }
    );
  }

  if (!isValidQuery(q)) {
    return NextResponse.json(
      { error: "That location does not look valid. Try a city name." },
      { status: 400 }
    );
  }

  const url = new URL(WEATHER_ENDPOINT);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("aqi", "no");

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: "Weather service authentication failed." },
        { status: 502 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        {
          error:
            "Weather service is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const apiMessage =
        payload?.error?.message || "Location not found. Try another city.";
      const status = response.status === 400 ? 404 : 502;
      return NextResponse.json({ error: apiMessage }, { status });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Could not reach the weather service. Check your connection and retry." },
      { status: 504 }
    );
  }
}
