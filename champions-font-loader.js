(() => {
  'use strict';

  const FONT_FAMILY = 'Champions Sans';
  const objectUrls = [];

  function decodeBase64(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function installFont(weight, base64) {
    if (!base64) throw new Error(`Champions Sans ${weight} font verisi eksik.`);
    const blob = new Blob([decodeBase64(base64)], { type: 'font/woff2' });
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);
    const face = new FontFace(FONT_FAMILY, `url(${objectUrl}) format("woff2")`, {
      weight: String(weight),
      style: 'normal',
      display: 'swap'
    });
    await face.load();
    document.fonts.add(face);
    return face;
  }

  async function install() {
    if (!window.FontFace || !document.fonts) return false;
    await Promise.all([
      installFont(400, window.__CHAMPIONS_REGULAR_B64),
      installFont(700, window.__CHAMPIONS_BOLD_B64)
    ]);
    delete window.__CHAMPIONS_REGULAR_B64;
    delete window.__CHAMPIONS_BOLD_B64;
    document.documentElement.classList.add('champions-font-ready');
    window.dispatchEvent(new CustomEvent('ucldraw:champions-font-ready'));
    return true;
  }

  window.UCLDRAW_CHAMPIONS_FONT_READY = install().catch((error) => {
    console.error(error);
    return false;
  });

  window.addEventListener('pagehide', () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, { once: true });
})();
