document.addEventListener('DOMContentLoaded', function () {
  // 1) 이미지가 없으면 placeholder 표시 (이미 실패한 이미지도 처리)
  function markMissing(img) {
    img.style.display = 'none';
    var host = img.closest('.cut') || img.closest('.art') || img.closest('.panel') || img.closest('.wiki-hero') || img.closest('.cctv');
    if (host) host.classList.add('noimg');
  }
  document.querySelectorAll('.art img, .panel img, .wiki-hero img, .cctv img, .cut > img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) { markMissing(img); return; }
    img.addEventListener('error', function () { markMissing(img); });
  });

  // 2) 이미지 위 효과(흑백·노이즈·스캔라인·글리치): .cctv 또는 .fx 클래스가 붙은 요소에 자동 적용
  var NW = 96, NH = 72;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var off = document.createElement('canvas'); off.width = NW; off.height = NH;
  var octx = off.getContext('2d');
  var imgData = octx.createImageData(NW, NH);
  var targets = [];

  function drawNoise() {
    var d = imgData.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    octx.putImageData(imgData, 0, 0);
    targets.forEach(function (ctx) { ctx.drawImage(off, 0, 0); });
  }

  function initFx(el) {
    if (el.dataset.fx) return;
    el.dataset.fx = '1';
    var img = el.querySelector('img');
    el.style.setProperty('--gd', (5 + Math.random() * 5).toFixed(1) + 's');
    el.style.setProperty('--gdel', '-' + (Math.random() * 5).toFixed(1) + 's');

    if (img) {
      var src = img.getAttribute('src');
      ['r', 'c'].forEach(function (k) {
        var g = document.createElement('img');
        g.className = 'fxg ' + k; g.src = src; g.alt = '';
        g.setAttribute('aria-hidden', 'true');
        g.addEventListener('error', function () { g.remove(); });
        img.parentNode.insertBefore(g, img.nextSibling);
      });
    }
    var cv = document.createElement('canvas');
    cv.width = NW; cv.height = NH; cv.className = 'fxl noise';
    el.appendChild(cv);
    targets.push(cv.getContext('2d'));
    ['scan', 'vig', 'roll'].forEach(function (c) {
      var d = document.createElement('div'); d.className = 'fxl ' + c; el.appendChild(d);
    });
  }

  document.querySelectorAll('.cctv, .fx').forEach(initFx);
  if (!targets.length) return;
  if (reduce) { drawNoise(); return; }
  var last = 0;
  (function loop(t) {
    if (!document.hidden && t - last > 90) { last = t; drawNoise(); }
    requestAnimationFrame(loop);
  })(0);
});
