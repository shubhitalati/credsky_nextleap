// Vercel serverless function: keeps the WeatherAPI key on the server.
module.exports = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: { message: 'Enter a city name.' } });
  const key = process.env.WEATHER_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'Weather service is not configured.' } });
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (!r.ok) {
      let msg = 'Could not fetch weather right now.';
      try {
        const code = JSON.parse(text).error?.code;
        if (code === 1006) msg = 'City not found. Check the spelling and try again.';
        else if (code === 2007) msg = 'Weather service limit reached. Try again later.';
        else if (code === 2006 || code === 2008 || code === 1002) msg = 'Weather service is unavailable right now.';
      } catch {}
      return res.status(r.status === 400 ? 404 : 502).json({ error: { message: msg } });
    }
    res.status(200).send(text);
  } catch {
    res.status(504).json({ error: { message: 'The weather service took too long. Please retry.' } });
  }
};
