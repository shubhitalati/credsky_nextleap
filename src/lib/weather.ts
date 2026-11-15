export const DEFAULT_CITY = "Mumbai";

export const POPULAR_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "New York",
  "London",
] as const;

export type WeatherPayload = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    uv: number;
    last_updated: string;
    condition: {
      text: string;
      icon: string;
    };
  };
};

export type Recommendation = {
  category: string;
  text: string;
};

export function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value}${suffix}`;
}

export function weatherIconUrl(icon?: string) {
  if (!icon) return "";
  return icon.startsWith("//") ? `https:${icon}` : icon;
}

export function getRecommendation(data: WeatherPayload): Recommendation {
  const temp = data.current.temp_c;
  const uv = data.current.uv;
  const humidity = data.current.humidity;
  const wind = data.current.wind_kph;
  const condition = (data.current.condition.text || "").toLowerCase();

  if (
    condition.includes("thunder") ||
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("shower")
  ) {
    return {
      category: "Rain Ready",
      text: "Carry an umbrella; waterproof layers help.",
    };
  }

  if (condition.includes("snow") || condition.includes("blizzard")) {
    return {
      category: "Snow Day",
      text: "Bundle up and watch for slippery paths.",
    };
  }

  if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze")) {
    return {
      category: "Low Visibility",
      text: "Give extra time if you are commuting.",
    };
  }

  if (typeof uv === "number" && uv >= 7) {
    return {
      category: "High UV",
      text: "Sunscreen and shade are a good idea.",
    };
  }

  if (typeof temp === "number" && temp >= 35) {
    return {
      category: "Hot Spell",
      text: "Stay hydrated; keep clothing light.",
    };
  }

  if (
    typeof temp === "number" &&
    temp >= 28 &&
    (condition.includes("sun") || condition.includes("clear"))
  ) {
    return {
      category: "Warm & Sunny",
      text: "Pleasant warmth, light layers work.",
    };
  }

  if (typeof temp === "number" && temp <= 10) {
    return {
      category: "Bundle Up",
      text: "It is chilly; a jacket will help.",
    };
  }

  if (typeof temp === "number" && temp <= 18) {
    return {
      category: "Mild Chill",
      text: "A light jacket should be enough.",
    };
  }

  if (typeof humidity === "number" && humidity >= 80) {
    return {
      category: "Sticky Air",
      text: "Breathable fabrics will feel better.",
    };
  }

  if (typeof wind === "number" && wind >= 30) {
    return {
      category: "Windy Out",
      text: "Secure loose layers and plan extra commute time.",
    };
  }

  if (condition.includes("cloud") || condition.includes("overcast")) {
    return {
      category: "Overcast",
      text: "Comfortable for stepping out; keep a light layer handy.",
    };
  }

  return {
    category: "Fair Skies",
    text: "Conditions look fine for heading out.",
  };
}
