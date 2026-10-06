document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.art img, .panel img, .wiki-hero img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.display = 'none';
      var host = img.closest('.art') || img.closest('.panel') || img.closest('.wiki-hero');
      if (host) host.classList.add('noimg');
    });
  });
});
