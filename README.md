# SkyCred

Check the sky's credit score before you step out.

SkyCred is a live weather website that shows current conditions for your location or any city, with a credit-score-inspired visual theme.

## Features

- Mumbai weather on first load
- Browser geolocation when permission is granted
- City search and popular city shortcuts
- Temperature, feels-like, humidity, wind, UV, and a clothing-style recommendation
- Formatted / raw JSON views with copy

Weather requests are proxied through `/api/weather` so the WeatherAPI key stays server-side.

## Setup

1. Copy `.env.example` to `.env.local`
2. Add your [WeatherAPI](https://www.weatherapi.com/docs/) key as `WEATHERAPI_KEY`
3. Run `npm install` and `npm run dev`

## API

`GET /api/weather?q=Mumbai` or `GET /api/weather?q=19.0760,72.8777`
