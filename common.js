// 펭귄 루프 모바일 - 게임과 공유 페이지가 함께 쓰는 코드 (픽셀 스프라이트, 공유 카드)
'use strict';

const SPRITE = (() => {
  const base = {}, scaled = {};
  function palette(tint) {
    if (!tint) return ART.palette;
    const [m, M, q] = ART.moonTints[tint];
    return Object.assign({}, ART.palette, { m, M, q });
  }
  function raw(name, tint) {
    const key = name + '|' + (tint || '');
    if (!base[key]) {
      const rows = ART.sprites[name], pal = palette(tint);
      const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
      const g = c.getContext('2d');
      rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { g.fillStyle = pal[r[x]]; g.fillRect(x, y, 1, 1); } });
      base[key] = c;
    }
    return base[key];
  }
  // 정수 배율로 미리 키워둔 캔버스 (기기 픽셀 기준) → 또렷한 픽셀
  function big(name, n, tint) {
    n = Math.max(1, Math.round(n));
    const key = name + '|' + (tint || '') + '|' + n;
    if (!scaled[key]) {
      const r = raw(name, tint), c = document.createElement('canvas');
      c.width = r.width * n; c.height = r.height * n;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(r, 0, 0, c.width, c.height);
      scaled[key] = c;
    }
    return scaled[key];
  }
  const size = name => [ART.sprites[name][0].length, ART.sprites[name].length];
  // (x, y) 왼쪽 위, s = 한 칸 크기(CSS px), dpr = 기기 픽셀 비율
  function draw(ctx, name, x, y, s, tint, dpr = 1) {
    const c = big(name, s * dpr, tint), [w, h] = size(name);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, x, y, w * s, h * s);
  }
  return { draw, size, big, raw };
})();

// 공유 카드 이미지 (1080x1080)
function drawShareCard(ctx, W, H, d, site) {
  const P = 10;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#050f22'); g.addColorStop(.6, '#0d2c4d'); g.addColorStop(1, '#1b4c6e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 110; i++) {
    ctx.globalAlpha = .3 + rnd() * .6; ctx.fillStyle = '#fff';
    ctx.fillRect(Math.floor(rnd() * W / P) * P, Math.floor(rnd() * 70) * P, P / 2, P / 2);
  }
  ctx.globalAlpha = 1;
  for (let x = 0; x < W; x += P) {
    const y0 = 720 + 50 * Math.sin(x * .006) + 22 * Math.sin(x * .017);
    [[0, '80,255,180', .43], [P, '80,255,180', .24], [2 * P, '110,190,255', .18]].forEach(([dd, c, a]) => {
      ctx.fillStyle = `rgba(${c},${a})`; ctx.fillRect(x, Math.floor((y0 + dd) / P) * P, P, P * 2);
    });
  }
  const gy = H - 9 * P;
  for (let x = 0; x < W; x += 16 * P) SPRITE.draw(ctx, 'ground', x, gy, P);
  SPRITE.draw(ctx, d.dead ? 'p_dead' : 'p_run1', 120, gy - 16 * 14, 14);
  SPRITE.draw(ctx, 'spike', 560, gy - 16 * 8, 8);
  SPRITE.draw(ctx, 'block', 720, gy - 16 * 8, 8);
  SPRITE.draw(ctx, 'fish', 860, gy - 16 * 16, 8);
  const font = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  const txt = (s, y, size, col, bold = true) => {
    ctx.font = `${bold ? 800 : 500} ${size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0b1430';
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 6]]) ctx.fillText(s, W / 2 + dx, y + dy);
    ctx.fillStyle = col; ctx.fillText(s, W / 2, y);
  };
  txt('펭귄 루프', 125, 110, '#eaf6ff');
  if (d.n) txt('♥ 신기록! ♥', 305, 40, '#ff8fa3');
  txt(d.label || '나의 기록', 360, 44, '#9fd8f5', false);
  txt(`${(+d.s).toLocaleString()}점`, 475, 150, '#ffd66b');
  txt(`물고기 ${d.f}마리 · 최고 ${(+d.b).toLocaleString()}점`, 600, 42, '#eaf6ff', false);
  if (site) txt('나도 도전하기 ▶ ' + site, 675, 30, '#cfe0ee', false);
  if (+d.s >= 5000) txt('★ 잼잼에게 점수를 인증하면 선물을 드리겠습니다!', 250, 34, '#ffd66b');
}

function siteBase() {
  return /^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/[^/]*$/, '') : '';
}
