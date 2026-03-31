// ── features/weather.js ───────────────────────────
// Pure weather logic — no DOM reads, no app state.

import { getWmoIcon } from '../utils/index.js';

// Temperatures from the API are in Fahrenheit (requested via temperature_unit=fahrenheit)
export function scorePlantingDay(hi, lo, prec, wmo) {
  let score = 100;
  // Frost / cold nights
  if      (lo < 32) score -= 70;
  else if (lo < 38) score -= 45;
  else if (lo < 45) score -= 15;
  // Cold days
  if      (hi < 45) score -= 30;
  else if (hi < 55) score -= 10;
  // Heat
  if      (hi > 95) score -= 25;
  else if (hi > 88) score -= 10;
  // Rain / precip
  if      (prec > 0.5)  score -= 40;
  else if (prec > 0.2)  score -= 18;
  else if (prec > 0.05) score -= 5;
  // Severe weather via WMO code
  if      (wmo >= 95)               score -= 45; // thunderstorm
  else if (wmo >= 71 && wmo <= 77)  score -= 55; // snow
  else if (wmo >= 65 && wmo <= 67)  score -= 25; // heavy rain
  return Math.max(0, Math.round(score));
}

// daily: weatherData.daily from Open-Meteo (temps in °F, precipitation in inches)
// container: DOM element to render into
// useMetric: boolean
export function render7DayForecast(daily, container, useMetric) {
  if (!daily || !container) return;
  const { time, temperature_2m_max, temperature_2m_min, weather_code } = daily;
  const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = new Date().toISOString().slice(0, 10);
  const startIdx = Math.max(0, time.findIndex(t => t === todayStr));
  container.innerHTML = time.slice(startIdx, startIdx + 7).map((d, i) => {
    const idx = startIdx + i;
    const date = new Date(d + 'T12:00:00');
    const day = DAY_ABBR[date.getDay()];
    const rawHi = temperature_2m_max[idx];
    const rawLo = temperature_2m_min[idx];
    const hi = useMetric ? Math.round((rawHi - 32) * 5 / 9) : Math.round(rawHi);
    const lo = useMetric ? Math.round((rawLo - 32) * 5 / 9) : Math.round(rawLo);
    const unit = useMetric ? '°C' : '°F';
    return `<div class="forecast-day">
      <span class="forecast-label">${day}</span>
      <span class="forecast-icon">${getWmoIcon(weather_code[idx])}</span>
      <span class="forecast-hi">${hi}${unit}</span>
      <span class="forecast-lo">${lo}${unit}</span>
    </div>`;
  }).join('');
}
