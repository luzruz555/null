/* CODE NULL — 공통 스크립트
   1) 이미지 확장자 자동 대체 + 없을 때만 자리표시
   2) 이미지 효과(흑백·노이즈·글리치)
   3) 웹툰 스크롤 등장 애니메이션
   4) 기록 보관소 접근 코드 (정답은 해시로만 저장됨) */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('reveal-on');

  /* ---------- 개발자도구용 힌트 ---------- */
  try {
    console.log('%cCODE NULL // ARCHIVE', 'font:700 16px monospace;color:#7fa8e0;');
    console.log('%c여기에 코드는 없다.\n잠긴 기록은 화면 위에 흩어진 두 개의 숫자로 열린다.\n  ① 누군가 잘못 입력한 코드\n  ② 문이 열린 시각\n형식: XXX-XXXX', 'font:13px monospace;color:#c9cfdb;line-height:1.6;');
  } catch (e) {}

  /* ---------- SHA-256 (외부 의존 없음) ---------- */
  function sha256(s) {
    function r(n, x) { return (x >>> n) | (x << (32 - n)); }
    var K = [], H = [], i, j, p = 2, c = 0;
    function isP(n) { for (var f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; }
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    while (c < 64) { if (isP(p)) { if (c < 8) H[c] = frac(Math.pow(p, 1 / 2)); K[c] = frac(Math.pow(p, 1 / 3)); c++; } p++; }
    s = unescape(encodeURIComponent(s));
    var l = s.length * 8, w = [];
    for (i = 0; i < s.length; i++) w[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
    w[l >> 5] |= 0x80 << (24 - (l % 32));
    w[(((l + 64) >> 9) << 4) + 15] = l;
    for (i = 0; i < w.length; i += 16) {
      var a = H.slice(0), W = [];
      for (j = 0; j < 64; j++) {
        if (j < 16) W[j] = w[i + j] | 0;
        else {
          var s0 = r(7, W[j - 15]) ^ r(18, W[j - 15]) ^ (W[j - 15] >>> 3);
          var s1 = r(17, W[j - 2]) ^ r(19, W[j - 2]) ^ (W[j - 2] >>> 10);
          W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0;
        }
        var t1 = (a[7] + (r(6, a[4]) ^ r(11, a[4]) ^ r(25, a[4])) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + K[j] + W[j]) | 0;
        var t2 = ((r(2, a[0]) ^ r(13, a[0]) ^ r(22, a[0])) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0].concat(a.slice(0, 7)); a[4] = (a[4] + t1) | 0;
      }
      for (j = 0; j < 8; j++) H[j] = (H[j] + a[j]) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return out;
  }
  window.CN_sha256 = sha256;

  // 정답의 해시값. 코드를 바꾸려면 README의 "접근 코드 바꾸기"를 참고하세요.
  var KEY_HASH = 'c46e482feea25bafc99a682dbbd8b71cd17cceb05f987be00a6eeeecc009afa4';
  var STORE = 'codenull-archive';

  function isUnlocked() { try { return localStorage.getItem(STORE) === KEY_HASH; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(STORE, KEY_HASH); } catch (e) {} }
  function openArchive() { document.body.classList.add('archive-open'); }
  function goArchive() {
    if (typeof window.CN_go === 'function') { openArchive(); window.CN_go('archive'); }
    else location.href = 'archive.html';
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- 1) 이미지: png → jpg → jpeg → webp 순으로 시도, 전부 없을 때만 자리표시 ---------- */
    var EXTS = ['jpg', 'jpeg', 'webp', 'PNG', 'JPG'];
    function markMissing(img) {
      img.style.display = 'none';
      var host = img.closest('.cut, .art, .panel, .wiki-hero, .cctv');
      if (host) host.classList.add('noimg');
    }
    function onFail(img) {
      var base = img.dataset.base || img.getAttribute('src').replace(/\.[a-zA-Z]+$/, '');
      img.dataset.base = base;
      var k = +(img.dataset.ei || 0);
      if (k < EXTS.length) { img.dataset.ei = k + 1; img.src = base + '.' + EXTS[k]; }
      else markMissing(img);
    }
    document.querySelectorAll('.art img, .panel img, .wiki-hero img, .cctv img, .cut > img').forEach(function (img) {
      img.addEventListener('error', function () { onFail(img); });
      if (img.complete && img.naturalWidth === 0) onFail(img);
    });

    /* ---------- 2) 이미지 효과 ---------- */
    var NW = 96, NH = 72;
    var off = document.createElement('canvas'); off.width = NW; off.height = NH;
    var octx = off.getContext('2d');
    var imgData = octx.createImageData(NW, NH);
    var targets = [];
    function drawNoise() {
      var d = imgData.data;
      for (var i = 0; i < d.length; i += 4) { var v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      octx.putImageData(imgData, 0, 0);
      targets.forEach(function (ctx) { ctx.drawImage(off, 0, 0); });
    }
    function addGlitch(img) {
      if (img.dataset.glitch) return; img.dataset.glitch = '1';
      ['r', 'c'].forEach(function (k) {
        var g = document.createElement('img');
        g.className = 'fxg ' + k; g.src = img.currentSrc || img.src; g.alt = '';
        g.setAttribute('aria-hidden', 'true');
        img.parentNode.insertBefore(g, img.nextSibling);
      });
    }
    function initFx(el) {
      if (el.dataset.fx) return; el.dataset.fx = '1';
      el.style.setProperty('--gd', (5 + Math.random() * 5).toFixed(1) + 's');
      el.style.setProperty('--gdel', '-' + (Math.random() * 5).toFixed(1) + 's');
      var img = el.querySelector('img');
      if (img) {
        if (img.complete && img.naturalWidth > 0) addGlitch(img);
        else img.addEventListener('load', function () { addGlitch(img); });
      }
      var cv = document.createElement('canvas');
      cv.width = NW; cv.height = NH; cv.className = 'fxl noise';
      el.appendChild(cv); targets.push(cv.getContext('2d'));
      ['scan', 'vig', 'roll'].forEach(function (c) { var d = document.createElement('div'); d.className = 'fxl ' + c; el.appendChild(d); });
    }
    document.querySelectorAll('.cctv, .fx').forEach(initFx);
    if (targets.length) {
      if (reduce) drawNoise();
      else { var last = 0; (function loop(t) { if (!document.hidden && t - last > 90) { last = t; drawNoise(); } requestAnimationFrame(loop); })(0); }
    }

    /* ---------- 3) 웹툰 스크롤 등장 ---------- */
    if (root.classList.contains('reveal-on')) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting || en.boundingClientRect.bottom < 0) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
      document.querySelectorAll('.strip .cut, .strip .gut, .strip .strip-end').forEach(function (el) { io.observe(el); });
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          document.querySelectorAll('.strip .cut:not(.in), .strip .gut:not(.in)').forEach(function (el) {
            if (el.getBoundingClientRect().bottom < 0) { el.classList.add('in'); io.unobserve(el); }
          });
        });
      }, { passive: true });
    }

    /* ---------- 4) 기록 보관소 접근 코드 ---------- */
    if (isUnlocked()) openArchive();

    var FAILS = ['ACCESS DENIED', '일치하는 기록이 없습니다.', '코드가 올바르지 않습니다.', '…그 숫자가 아니다.'];
    var tries = 0;
    document.querySelectorAll('form.code-gate').forEach(function (form) {
      var input = form.querySelector('input');
      var msg = form.querySelector('.msg');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = (input.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!v) return;
        if (sha256(v) === KEY_HASH) {
          remember();
          form.classList.remove('bad'); form.classList.add('ok');
          msg.textContent = 'ACCESS GRANTED — 기록을 복구합니다…';
          document.body.classList.add('glitch-flash');
          setTimeout(function () {
            document.body.classList.remove('glitch-flash');
            if (form.dataset.mode === 'inline') { openArchive(); window.scrollTo(0, 0); }
            else goArchive();
          }, 900);
        } else {
          tries++;
          msg.textContent = FAILS[(tries - 1) % FAILS.length];
          form.classList.remove('bad'); void form.offsetWidth; form.classList.add('bad');
          input.select();
          if (tries >= 3) document.querySelectorAll('.more-hint').forEach(function (h) { h.hidden = false; });
        }
      });
    });
    document.querySelectorAll('[data-lock]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem(STORE); } catch (err) {}
        document.body.classList.remove('archive-open');
        document.querySelectorAll('form.code-gate').forEach(function (f) { f.classList.remove('ok'); f.querySelector('.msg').textContent = ''; f.querySelector('input').value = ''; });
        window.scrollTo(0, 0);
      });
    });
  });
})();
