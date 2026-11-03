import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

for (const artifact of ['unminified', 'minified']) {
  const path = artifact === 'unminified' ? '../.build/no-playlist-autoplay-youtube.js' : '../no-playlist-autoplay-youtube.user.js';
  const code = readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const property of ['TEST_ONLY', 'canAutoAdvance_']) {
    void test(`${artifact}: working controller ignores a protected ${property} fallback`, () => {
      const controller = { canAutoAdvance_: true };
      const manager = { polymerController: controller };
      Object.defineProperty(manager, property, { get(): never { throw new Error('Protected native fallback'); } });
      runInNewContext(code, {
        window: new EventTarget(),
        document: { querySelector: (): object => manager },
        location: { hostname: 'www.youtube.com', pathname: '/watch', search: '?list=playlist' },
        URLSearchParams
      });
      assert.equal(controller.canAutoAdvance_, false);
    });
  }
  void test(`${artifact}: working native setter ignores a protected direct fallback`, () => {
    let allowed = true;
    const manager = { TEST_ONLY: { setCanAutoAdvance(value: boolean): void { allowed = value; } } };
    Object.defineProperty(manager, 'canAutoAdvance_', { get(): never { throw new Error('Protected native fallback'); } });
    runInNewContext(code, {
      window: new EventTarget(),
      document: { querySelector: (): object => manager },
      location: { hostname: 'www.youtube.com', pathname: '/watch', search: '?list=playlist' },
      URLSearchParams
    });
    assert.equal(allowed, false);
  });
  void test(`${artifact}: repeated execution disables the replacement playlist manager once per navigation`, () => {
    let changes = 0;
    const manager = {
      polymerController: {
        get canAutoAdvance_(): boolean { return true; },
        set canAutoAdvance_(_value: boolean) { changes++; }
      }
    };
    const context = {
      window: new EventTarget(),
      document: { querySelector: (): object => manager },
      location: { hostname: 'www.youtube.com', pathname: '/watch', search: '?list=playlist' },
      URLSearchParams
    };
    runInNewContext(code, context);
    runInNewContext(code, context);
    changes = 0;
    context.window.dispatchEvent(new Event('yt-navigate-finish'));
    assert.equal(changes, 1);
  });
}
