import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

let browser: Browser | undefined;
before(async () => { browser = await chromium.launch({ headless: true, args: ['--mute-audio'] }); });
after(async () => { await browser?.close(); });

for (const artifact of ['unminified', 'minified']) {
  for (const host of ['www.youtube.com', 'm.youtube.com']) {
    void test(artifact + ': ' + host + ' blocks automatic advancement while manual selection works', async () => {
      assert.ok(browser);
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const path = artifact === 'unminified' ? '../.build/no-playlist-autoplay-youtube.js' : '../no-playlist-autoplay-youtube.user.js';
      const code = await readFile(new URL(path, import.meta.url), 'utf8');
      await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><yt-playlist-manager></yt-playlist-manager><div id="movie_player" data-video="first"></div><ytd-playlist-panel-video-renderer><a id="wc-endpoint" href="/watch?v=second&list=playlist">Select second video</a></ytd-playlist-panel-video-renderer>' }));
      try {
        await page.goto('https://' + host + '/watch?v=first&list=playlist');
        await page.evaluate(() => {
          const manager = document.querySelector('yt-playlist-manager');
          const player = document.querySelector('#movie_player');
          if (!(manager instanceof HTMLElement) || !(player instanceof HTMLElement)) throw new Error('Missing native fixture');
          const controller = { canAutoAdvance_: true };
          Object.defineProperty(manager, 'polymerController', { value: controller });
          const select = (id: string): void => {
            player.dataset['video'] = id;
            history.pushState(null, '', '/watch?v=' + id + '&list=playlist');
            window.dispatchEvent(new Event('yt-navigate-finish'));
          };
          window.addEventListener('player-state-change', event => {
            const detail: unknown = 'detail' in event ? event.detail : null;
            if (typeof detail === 'object' && detail !== null && 'state' in detail && detail.state === 0 && controller.canAutoAdvance_) select(player.dataset['video'] === 'first' ? 'second' : 'third');
          });
          document.addEventListener('click', event => {
            const link = event.target instanceof Element ? event.target.closest('a') : null;
            if (!link) return;
            event.preventDefault();
            select(new URL(link.href).searchParams.get('v') ?? '');
          });
        });
        await page.addScriptTag({ content: code });
        const finish = async (): Promise<void> => {
          await page.evaluate(() => {
            window.dispatchEvent(new Event('yt-navigate-finish'));
            document.querySelector('#movie_player')?.dispatchEvent(new CustomEvent('player-state-change', { bubbles: true, cancelable: false, detail: { state: 0 } }));
          });
        };
        await finish();
        assert.equal(new URL(page.url()).searchParams.get('v'), 'first');
        assert.equal(await page.locator('#movie_player').getAttribute('data-video'), 'first');
        await page.getByRole('link', { name: 'Select second video' }).click();
        assert.equal(new URL(page.url()).searchParams.get('v'), 'second');
        assert.equal(new URL(page.url()).searchParams.get('list'), 'playlist');
        assert.equal(await page.locator('#movie_player').getAttribute('data-video'), 'second');
        await finish();
        assert.equal(new URL(page.url()).searchParams.get('v'), 'second');
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    });
  }
}
