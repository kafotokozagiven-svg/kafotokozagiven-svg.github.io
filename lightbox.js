// Click any photo or screenshot to see it full size. Arrows or swipe to move, Esc or click outside to close.
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".photos .photo img"));
  if (!imgs.length) return;
  var box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.innerHTML =
    '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-prev" aria-label="Previous">&#8249;</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lb-next" aria-label="Next">&#8250;</button>';
  document.body.appendChild(box);
  var big = box.querySelector("img"), cap = box.querySelector("figcaption"), i = 0;
  function list() { return imgs.filter(function (x) { return x.isConnected; }); }
  function show(n) {
    var l = list(); if (!l.length) return;
    i = (n + l.length) % l.length;
    big.src = l[i].src; big.alt = l[i].alt; cap.textContent = l[i].alt;
    box.hidden = false; document.body.style.overflow = "hidden";
  }
  function close() { box.hidden = true; document.body.style.overflow = ""; }
  imgs.forEach(function (img) {
    img.addEventListener("click", function () { show(list().indexOf(img)); });
  });
  box.querySelector(".lb-close").onclick = close;
  box.querySelector(".lb-prev").onclick = function (e) { e.stopPropagation(); show(i - 1); };
  box.querySelector(".lb-next").onclick = function (e) { e.stopPropagation(); show(i + 1); };
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });
  var x0 = null;
  box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
    x0 = null;
  });
})();
