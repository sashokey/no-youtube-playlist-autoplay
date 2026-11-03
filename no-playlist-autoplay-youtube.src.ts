// ==UserScript==
// @name         No Playlist Autoplay for YouTube
// @namespace    https://github.com/sashokey/no-youtube-playlist-autoplay
// @version      1.0.5
// @description  Violentmonkey: prevents YouTube from automatically advancing playlist videos.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @inject-into  page
// @noframes
// @grant        none
// @updateURL    https://raw.githubusercontent.com/sashokey/no-youtube-playlist-autoplay/master/no-playlist-autoplay-youtube.user.js
// @downloadURL  https://raw.githubusercontent.com/sashokey/no-youtube-playlist-autoplay/master/no-playlist-autoplay-youtube.user.js
// ==/UserScript==

(() => {
  'use strict';
  const initialized = Symbol.for('no-playlist-autoplay-youtube');
  const installed: unknown = Reflect.get(window, initialized);
  if (installed === true) return;
  try { Object.defineProperty(window, initialized, { value: true }); } catch { return; }

  if (location.hostname === 'm.youtube.com') {
    window.addEventListener('player-state-change', event => {
      const detail: unknown = 'detail' in event ? event.detail : undefined;
      if (typeof detail === 'object' && detail !== null && 'state' in detail && detail.state === 0 &&
          location.pathname === '/watch' && new URLSearchParams(location.search).get('list')) event.stopImmediatePropagation();
    }, true);
    return;
  }

  const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
  function disablePlaylistAutoplay(): void {
    const manager = document.querySelector('yt-playlist-manager');
    if (!manager) return;
    try {
      const controller: unknown = Reflect.get(manager, 'polymerController');
      if (record(controller) && typeof controller['canAutoAdvance_'] === 'boolean') {
        Reflect.set(controller, 'canAutoAdvance_', false);
        return;
      }
      const native: unknown = Reflect.get(manager, 'TEST_ONLY');
      if (record(native) && typeof native['setCanAutoAdvance'] === 'function') {
        Reflect.apply(native['setCanAutoAdvance'], native, [false]);
        return;
      }
      const direct: unknown = Reflect.get(manager, 'canAutoAdvance_');
      if (typeof direct === 'boolean') Reflect.set(manager, 'canAutoAdvance_', false);
    } catch {}
  }

  window.addEventListener('yt-navigate-finish', disablePlaylistAutoplay);
  disablePlaylistAutoplay();
})();
