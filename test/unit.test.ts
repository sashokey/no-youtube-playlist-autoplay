import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

class PlayerStateEvent extends Event {
  readonly detail: unknown;
  constructor(detail: unknown) { super('player-state-change'); this.detail = detail; }
}

for (const artifact of ['unminified', 'minified']) {
  const path = artifact === 'unminified' ? '../.build/no-playlist-autoplay-youtube.js' : '../no-playlist-autoplay-youtube.user.js';
  const code = readFileSync(new URL(path, import.meta.url), 'utf8');

  function start(host = 'www.youtube.com', pathname = '/watch', search = '?v=first&list=playlist', manager: unknown = null) {
    const window = new EventTarget();
    const location = { hostname: host, pathname, search };
    let active: unknown = manager;
    const context = { window, location, URLSearchParams, document: { querySelector: (): unknown => active } };
    const repeat = (): void => { runInNewContext(code, context); };
    repeat();
    return { window, location, repeat, replace: (value: unknown): void => { active = value; } };
  }

  void test(artifact + ': disables the native controller', () => {
    const controller = { canAutoAdvance_: true };
    start('www.youtube.com', '/watch', '?list=playlist', { polymerController: controller });
    assert.equal(controller.canAutoAdvance_, false);
  });
  void test(artifact + ': disables the native manager', () => {
    const manager = { canAutoAdvance_: true };
    start('www.youtube.com', '/watch', '?list=playlist', manager);
    assert.equal(manager.canAutoAdvance_, false);
  });
  void test(artifact + ': invokes the supported native setter', () => {
    let allowed = true;
    start('www.youtube.com', '/watch', '?list=playlist', { TEST_ONLY: { setCanAutoAdvance(value: boolean): void { allowed = value; } } });
    assert.equal(allowed, false);
  });
  void test(artifact + ': disables a replacement manager after navigation', () => {
    const state = start();
    const manager = { canAutoAdvance_: true };
    state.replace(manager);
    state.window.dispatchEvent(new Event('yt-navigate-finish'));
    assert.equal(manager.canAutoAdvance_, false);
  });
  void test(artifact + ': ignores an unsupported manager', () => {
    const manager = { unrelated: true };
    const state = start('www.youtube.com', '/watch', '', manager);
    state.window.dispatchEvent(new Event('yt-navigate-finish'));
    assert.deepEqual(manager, { unrelated: true });
  });
  const cases = [
    ['playlist end', '/watch', '?v=first&list=playlist', 0, true],
    ['non-playlist end', '/watch', '?v=first', 0, false],
    ['empty playlist', '/watch', '?list=', 0, false],
    ['unrelated route', '/', '?list=playlist', 0, false],
    ['playing', '/watch', '?list=playlist', 1, false],
    ['paused', '/watch', '?list=playlist', 2, false]
  ] as const;
  for (const [name, route, search, playerState, blocked] of cases) {
    void test(artifact + ': mobile ' + name, () => {
      const state = start('m.youtube.com', route, search);
      let delivered = false;
      state.window.addEventListener('player-state-change', () => { delivered = true; });
      state.window.dispatchEvent(new PlayerStateEvent({ state: playerState }));
      assert.equal(delivered, !blocked);
    });
  }
  void test(artifact + ': mobile handler follows the current route', () => {
    const state = start('m.youtube.com', '/', '');
    state.location.pathname = '/watch';
    state.location.search = '?list=playlist';
    let delivered = false;
    state.window.addEventListener('player-state-change', () => { delivered = true; });
    state.window.dispatchEvent(new PlayerStateEvent({ state: 0 }));
    assert.equal(delivered, false);
  });
}
