// ==UserScript==
// @name         PB iOS Mouse Fix
// @namespace    pb-esp-ext
// @version      1.0.0
// @description  iOS/iPadOS Safari: hide the cursor in-match and scale mouse look. No pointer lock, no mobile spoof.
// @match        *://shootingpoint.xyz/*
// @match        *://*.shootingpoint.xyz/*
// @match        *://*.trycloudflare.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  iOS Safari does not implement Element.requestPointerLock, and JS
   *  cannot hide or warp the OS pointer. This script does the two things
   *  that are actually possible:
   *    1) force the game's own "pb-hide-cursor" state in-match
   *    2) map mouse position through an ease-out curve so the game sees
   *       a faster, farther virtual pointer; the game's own 12px edge
   *       turn then takes over for continuous turning.
   *  It does not touch navigator/UA, mobile spoof or the game internals.
   * ------------------------------------------------------------------ */

  const KEY = 'pbIosMouseFix.v1';
  const DEFAULTS = { on: true, sens: 1.6, hide: true, dot: true };
  let cfg = { ...DEFAULTS };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} };

  const style = document.createElement('style');
  style.id = 'pb-ios-mf-style';
  style.textContent = `
    html.pb-ios-mf, html.pb-ios-mf *, html.pb-ios-mf *::before, html.pb-ios-mf *::after { cursor: none !important; }
    #pb-ios-mf-dot { position: fixed; left: 0; top: 0; width: 6px; height: 6px; margin: -3px 0 0 -3px;
      border-radius: 50%; background: #46f58a; box-shadow: 0 0 3px #000, 0 0 8px #46f58a;
      pointer-events: none; z-index: 2147483600; display: none; }
    #pb-ios-mf-badge { position: fixed; left: 8px; bottom: 8px; z-index: 2147483601; padding: 3px 7px;
      border: 1px solid #46f58a88; background: #0b0f14cc; color: #46f58a; font: 600 11px/1.2 monospace;
      border-radius: 3px; user-select: none; cursor: pointer; }
    #pb-ios-mf-panel { position: fixed; left: 8px; bottom: 34px; z-index: 2147483601; width: 230px;
      padding: 10px; background: #0b0f14f2; border: 1px solid #2a3a46; border-radius: 4px;
      color: #d7e2ea; font: 12px/1.5 Tahoma, sans-serif; display: none; }
    #pb-ios-mf-panel .h { color: #46f58a; font-weight: 700; margin-bottom: 6px; }
    #pb-ios-mf-panel label { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 5px 0; }
    #pb-ios-mf-panel input[type="range"] { width: 118px; }
    #pb-ios-mf-panel .r { color: #8fa3b0; font-size: 11px; margin-top: 7px; }
  `;
  (document.head || document.documentElement).appendChild(style);

  const dot = document.createElement('div'); dot.id = 'pb-ios-mf-dot';
  const badge = document.createElement('div'); badge.id = 'pb-ios-mf-badge';
  const panel = document.createElement('div'); panel.id = 'pb-ios-mf-panel';
  panel.innerHTML = `
    <div class="h">iOS Mouse Fix</div>
    <label>Enable <input type="checkbox" data-k="on"></label>
    <label>Sensitivity <input type="range" data-k="sens" min="1" max="2.5" step="0.1"><b data-v="sens"></b></label>
    <label>Hide cursor <input type="checkbox" data-k="hide"></label>
    <label>Cursor dot <input type="checkbox" data-k="dot"></label>
    <div class="r">F6 = panel · no mobile spoof · no pointer lock needed</div>
  `;

  const $ = (sel) => panel.querySelector(sel);
  function ui() {
    $('input[data-k="on"]').checked = cfg.on;
    $('input[data-k="sens"]').value = cfg.sens;
    $('b[data-v="sens"]').textContent = cfg.sens.toFixed(1) + 'x';
    $('input[data-k="hide"]').checked = cfg.hide;
    $('input[data-k="dot"]').checked = cfg.dot;
    badge.textContent = cfg.on ? `MF ${cfg.sens.toFixed(1)}x` : 'MF OFF';
    badge.style.color = cfg.on ? '#46f58a' : '#8fa3b0';
  }

  let hidden = false;
  const inBattle = () => {
    const b = document.getElementById('blocker');
    return !!b && b.dataset.battleActive === 'true';
  };
  function syncCursor() {
    const want = cfg.on && cfg.hide && inBattle();
    if (want !== hidden) {
      hidden = want;
      document.documentElement.classList.toggle('pb-ios-mf', want);
    }
    dot.style.display = hidden && cfg.dot ? 'block' : 'none';
  }

  function isUi(t) {
    return !!(t && t.closest && t.closest(
      'button,input,textarea,select,[role="button"],.pb-touch-dock,.pb-panel,' +
      '.pb-menu,.pb-settings,.pb-bindings,.pb-touch-editing'
    ));
  }
  function isPlay(t) {
    if (!t || !t.closest || isUi(t)) return false;
    return !!t.closest('canvas,#blocker,#app') || t === document.body || t === document.documentElement;
  }
  function shadow(ev, name, value) {
    try { Object.defineProperty(ev, name, { value, configurable: true }); } catch {}
  }

  /* Ease-out mapping: derivative = k at centre, 0 at the screen edge,
     monotonic, and it lands exactly on 0 / width so the game's own edge
     turn (12 px zone) still triggers. n in [-1, 1]. */
  function axis(v, half, k) {
    const n = Math.max(-1, Math.min(1, (v - half) / half));
    const a = Math.abs(n);
    const f = a ? 1 - Math.pow(1 - a, k) : 0;
    return half + half * Math.sign(n) * f;
  }

  function onMove(e) {
    if (!cfg.on || e.pointerType === 'touch' || !isPlay(e.target)) return;
    const w = innerWidth, h = innerHeight;
    const k = Math.max(1, Math.min(2.5, cfg.sens));
    const rx = e.clientX, ry = e.clientY;
    const mx = typeof e.movementX === 'number' ? e.movementX : 0;
    const my = typeof e.movementY === 'number' ? e.movementY : 0;
    shadow(e, 'clientX', axis(rx, w / 2, k));
    shadow(e, 'clientY', axis(ry, h / 2, k));
    shadow(e, 'movementX', mx * k);
    shadow(e, 'movementY', my * k);
    if (hidden && cfg.dot) dot.style.transform = `translate3d(${rx}px,${ry}px,0)`;
  }

  function boot() {
    if (document.head && style.parentNode !== document.head) document.head.appendChild(style);
    document.body.append(dot, badge, panel);
    ui();
    syncCursor();
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot, { once: true });

  document.addEventListener('pointermove', onMove, { capture: true, passive: true });
  document.addEventListener('mousemove', onMove, { capture: true, passive: true });

  setInterval(syncCursor, 500);
  new MutationObserver(syncCursor).observe(document.documentElement, {
    attributes: true, attributeFilter: ['class']
  });
  (function watchBlocker() {
    const b = document.getElementById('blocker');
    if (b) {
      new MutationObserver(syncCursor).observe(b, {
        attributes: true, attributeFilter: ['class', 'data-battle-active']
      });
      syncCursor();
    } else {
      setTimeout(watchBlocker, 500);
    }
  })();

  badge.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  });
  panel.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (k === 'on' || k === 'hide' || k === 'dot') cfg[k] = e.target.checked;
    else if (k === 'sens') cfg.sens = Math.max(1, Math.min(2.5, Number(e.target.value)));
    save(); ui(); syncCursor();
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F6' && !e.repeat) {
      e.preventDefault();
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    }
  }, { capture: true });
})();
