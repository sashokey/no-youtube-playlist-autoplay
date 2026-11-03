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
"use strict";(()=>{const t=Symbol.for("no-playlist-autoplay-youtube");if(!0===Reflect.get(window,t))return;try{Object.defineProperty(window,t,{value:!0})}catch{return}if("m.youtube.com"===location.hostname)return void window.addEventListener("player-state-change",t=>{const e="detail"in t?t.detail:void 0;"object"==typeof e&&null!==e&&"state"in e&&0===e.state&&"/watch"===location.pathname&&new URLSearchParams(location.search).get("list")&&t.stopImmediatePropagation()},!0);const e=t=>"object"==typeof t&&null!==t;function n(){const t=document.querySelector("yt-playlist-manager");if(t)try{const n=Reflect.get(t,"polymerController");if(e(n)&&"boolean"==typeof n.canAutoAdvance_)return void Reflect.set(n,"canAutoAdvance_",!1);const o=Reflect.get(t,"TEST_ONLY");if(e(o)&&"function"==typeof o.setCanAutoAdvance)return void Reflect.apply(o.setCanAutoAdvance,o,[!1]);"boolean"==typeof Reflect.get(t,"canAutoAdvance_")&&Reflect.set(t,"canAutoAdvance_",!1)}catch{}}window.addEventListener("yt-navigate-finish",n),n()})();
