/* ═══════════════════════════════════════════════════════════════════════
   UI — tooltip, detail card, filter controls, HUD counts, UTC clock
   All DOM writes live here; state.js decides *when* they happen.
   ═══════════════════════════════════════════════════════════════════════ */

import { REGION_LIST, countriesInRegion, formatCoords } from './data.js';

const TOUCH = window.matchMedia('(hover: none)').matches;

export function initUI({ reduced, onRegion, onCountry, onCloseCard }) {
  const $ = id => document.getElementById(id);

  const els = {
    tooltip: $('tooltip'), ttName: $('ttName'), ttLoc: $('ttLoc'),
    ttStatus: $('ttStatus'), ttRfs: $('ttRfs'),
    card: $('detailCard'), cardCode: $('cardCode'), cardStatus: $('cardStatus'),
    cardClose: $('cardClose'), cardName: $('cardName'), cardLoc: $('cardLoc'),
    dishStage: $('dishStage'), dishTemplate: $('dishTemplate'),
    specCoords: $('specCoords'), specAntennas: $('specAntennas'),
    specCapacity: $('specCapacity'), specSats: $('specSats'),
    specRfs: $('specRfs'), specRegion: $('specRegion'),
    cardNotes: $('cardNotes'),
    countActive: $('countActive'), countPlanned: $('countPlanned'),
    scopeLine: $('scopeLine'), utcClock: $('utcClock'),
    countrySelect: $('countrySelect'),
    segBtns: [...document.querySelectorAll('.seg-btn')],
  };

  /* ── filter controls ─────────────────────────────────────────────── */

  els.segBtns.forEach(btn =>
    btn.addEventListener('click', () => onRegion(btn.dataset.region))
  );
  els.countrySelect.addEventListener('change', () => onCountry(els.countrySelect.value));
  els.cardClose.addEventListener('click', onCloseCard);

  function setRegionActive(region) {
    els.segBtns.forEach(btn => {
      const on = btn.dataset.region === region;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function populateCountries(region, selected = 'ALL') {
    const sel = els.countrySelect;
    sel.innerHTML = '';
    sel.append(new Option('ALL COUNTRIES', 'ALL'));
    if (region === 'ALL') {
      for (const r of REGION_LIST) {
        const group = document.createElement('optgroup');
        group.label = r;
        for (const c of countriesInRegion(r)) group.append(new Option(c, c));
        sel.append(group);
      }
    } else {
      for (const c of countriesInRegion(region)) sel.append(new Option(c, c));
    }
    sel.value = selected;
  }

  /* ── chips ───────────────────────────────────────────────────────── */

  function setChip(el, status, extraClass = '') {
    el.textContent = status;
    el.className = `chip ${extraClass} ${status === 'ACTIVE' ? 'chip--active' : 'chip--planned'}`.trim();
  }

  /* ── tooltip ─────────────────────────────────────────────────────── */

  function moveTooltip(e) {
    const tt = els.tooltip;
    const pad = 14;
    const r = tt.getBoundingClientRect();
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
    tt.style.left = `${x}px`;
    tt.style.top = `${y}px`;
  }

  function showTooltip(g, e) {
    if (TOUCH) return;                       // tap goes straight to the detail card
    els.ttName.textContent = g.name;
    els.ttLoc.textContent = `${g.city} · ${g.country}`;
    setChip(els.ttStatus, g.status);
    els.ttRfs.textContent = `RFS ${g.rfsDate}`;
    els.tooltip.hidden = false;
    moveTooltip(e);
    els.tooltip.classList.add('is-visible');
  }

  function hideTooltip() {
    els.tooltip.classList.remove('is-visible');
  }

  /* ── detail card ─────────────────────────────────────────────────── */

  let cardToken = 0;

  function openCard(g) {
    cardToken++;
    els.cardCode.textContent = g.id;
    setChip(els.cardStatus, g.status);
    els.cardName.textContent = g.name;
    els.cardLoc.textContent = `${g.city} · ${g.country} · ${g.region}`;
    els.specCoords.textContent = formatCoords(g.lat, g.lng);
    els.specAntennas.textContent = `${g.antennas} × PARABOLIC`;
    els.specCapacity.textContent = `${g.capacityGbps} Gbps`;
    els.specRfs.textContent = g.rfsDate;
    els.specRegion.textContent = g.region;
    els.cardNotes.textContent = g.notes;

    // Fresh dish clone restarts its CSS animations for free.
    els.dishStage.replaceChildren(els.dishTemplate.content.cloneNode(true));

    els.card.hidden = false;
    els.card.scrollTop = 0;
    // Double rAF so the unhidden frame paints before the transition arms.
    requestAnimationFrame(() => requestAnimationFrame(() => els.card.classList.add('is-open')));

    countUp(els.specSats, g.connectedSats, 600, 250);
  }

  function closeCard() {
    const token = ++cardToken;
    if (!els.card.classList.contains('is-open')) { els.card.hidden = true; return; }
    els.card.classList.remove('is-open');
    setTimeout(() => { if (token === cardToken) els.card.hidden = true; }, 340);
  }

  function isCardOpen() {
    return !els.card.hidden;
  }

  /* ── count-up ────────────────────────────────────────────────────── */

  let countRaf = 0;

  function countUp(el, target, duration = 600, delay = 0) {
    cancelAnimationFrame(countRaf);
    if (reduced) { el.textContent = String(target); return; }
    el.textContent = '0';
    const t0 = performance.now() + delay;
    const step = now => {
      if (now < t0) { countRaf = requestAnimationFrame(step); return; }
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) countRaf = requestAnimationFrame(step);
    };
    countRaf = requestAnimationFrame(step);
  }

  /* ── HUD counts + scope ──────────────────────────────────────────── */

  function setScopeHud({ active, planned }, label) {
    els.countActive.textContent = String(active);
    els.countPlanned.textContent = String(planned);
    els.scopeLine.textContent = label;
  }

  /* ── UTC clock ───────────────────────────────────────────────────── */

  function tickClock() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    els.utcClock.textContent = `UTC ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  populateCountries('ALL');

  return {
    showTooltip, moveTooltip, hideTooltip,
    openCard, closeCard, isCardOpen,
    setRegionActive, populateCountries,
    setScopeHud,
  };
}
