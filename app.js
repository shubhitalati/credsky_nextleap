const CITIES = ['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','New York','London'];
const $ = id => document.getElementById(id);
let rawText = '', parsed = null, view = 'formatted', active = '';

const chips = $('chips');
CITIES.forEach(c => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = c; b.setAttribute('aria-pressed', 'false');
  b.onclick = () => load(c, c);
  chips.appendChild(b);
});

function showMsg(t) { $('msg').textContent = t || ''; $('msg').hidden = !t; }
function setActive(name) {
  active = name;
  [...chips.children].forEach(b => b.setAttribute('aria-pressed', String(b.textContent === name)));
}
const val = (v, unit = '') => (v === undefined || v === null || v === '') ? 'N/A' : v + unit;

function recommend(c) {
  const t = c.feelslike_c, txt = (c.condition.text || '').toLowerCase();
  if (/thunder/.test(txt)) return ['Stormy', 'Thunder around. Stay indoors if you can.'];
  if (/rain|drizzle|shower/.test(txt)) return ['Wet', 'Carry an umbrella or a rain jacket.'];
  if (/snow|sleet|blizzard|ice/.test(txt)) return ['Snowy', 'Wear warm, waterproof layers.'];
  if (/fog|mist|haze|smoke/.test(txt) && t < 35) return ['Hazy', 'Visibility is low. A mask helps if the air feels thick.'];
  if (t >= 38) return ['Scorching', 'Drink water, wear light cotton and avoid midday sun.'];
  if (t >= 30) return c.uv >= 6 ? ['Hot & Sunny', 'Sunscreen and sunglasses, please.'] : ['Warm & Sunny', 'Pleasant warmth, light layers work.'];
  if (t >= 20) return ['Mild', 'Comfortable weather. A light layer is enough.'];
  if (t >= 10) return ['Cool', 'Bring a jacket or sweater.'];
  return ['Cold', 'Bundle up with a heavy coat.'];
}

function renderJson() {
  if (!parsed) return;
  $('jsonView').textContent = view === 'formatted' ? JSON.stringify(parsed, null, 2) : rawText;
  $('tabF').setAttribute('aria-selected', String(view === 'formatted'));
  $('tabR').setAttribute('aria-selected', String(view === 'raw'));
}

function render(d) {
  const l = d.location, c = d.current;
  $('place').textContent = val(l.name);
  $('region').textContent = [l.region, l.country].filter(Boolean).join(', ');
  $('time').textContent = 'Local time: ' + val(l.localtime);
  $('temp').textContent = val(c.temp_c);
  $('cond').textContent = val(c.condition?.text);
  $('feels').textContent = val(c.feelslike_c, '°C');
  $('hum').textContent = val(c.humidity, '%');
  $('wind').textContent = val(c.wind_kph, ' kph');
  $('uv').textContent = val(c.uv);
  const icon = c.condition?.icon;
  $('icon').src = icon ? (icon.startsWith('//') ? 'https:' + icon : icon) : '';
  $('icon').alt = c.condition?.text || '';
  const [t, x] = recommend(c);
  $('recoTitle').textContent = t; $('recoText').textContent = x;
}

async function load(q, chipName = '') {
  $('loading').hidden = false; showMsg('');
  try {
    const r = await fetch('/api/weather?q=' + encodeURIComponent(q));
    const text = await r.text();
    let d; try { d = JSON.parse(text); } catch { throw new Error('Unexpected response. Please retry.'); }
    if (!r.ok || d.error) throw new Error(d.error?.message || 'Could not fetch weather. Please retry.');
    if (!d.location || !d.current) throw new Error('Incomplete weather data received. Please retry.');
    rawText = text; parsed = d;
    render(d); renderJson();
    setActive(chipName || (CITIES.includes(d.location.name) ? d.location.name : ''));
  } catch (e) {
    showMsg(e.name === 'TypeError' ? 'Network problem. Check your connection and retry.' : e.message);
  } finally { $('loading').hidden = true; }
}

$('search').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('city').value.trim();
  if (!q) return showMsg('Enter a city name to search.');
  load(q);
});
$('tabF').onclick = () => { view = 'formatted'; renderJson(); };
$('tabR').onclick = () => { view = 'raw'; renderJson(); };
$('copy').onclick = async () => {
  if (!parsed) return;
  const btn = $('copy');
  try {
    await navigator.clipboard.writeText($('jsonView').textContent);
    btn.textContent = 'Copied';
  } catch { btn.textContent = 'Copy failed'; showMsg('Copying was blocked by your browser.'); }
  setTimeout(() => btn.textContent = 'Copy', 1500);
};

// Launch: Mumbai first, then swap to the user's location if permitted.
load('Mumbai', 'Mumbai').then(() => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    p => load(`${p.coords.latitude.toFixed(4)},${p.coords.longitude.toFixed(4)}`),
    () => {}, { timeout: 8000 });
});
