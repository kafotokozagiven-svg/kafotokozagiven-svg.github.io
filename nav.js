// Phone menu: the button shows and hides the links.
(function () {
  var nav = document.querySelector('.nav');
  var btn = document.querySelector('.nav-toggle');
  if (!nav || !btn) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
  });
})();

// Gentle fade-in for photos and project cards as they scroll into view.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var items = document.querySelectorAll('.photos .photo, .case');
  if (!items.length) return;
  document.documentElement.classList.add('reveal-on');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(function () { el.classList.remove('reveal', 'in'); }, 700);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
  items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();
