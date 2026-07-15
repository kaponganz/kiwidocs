(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);

  function getSku() {
    return new URLSearchParams(window.location.search).get("sku");
  }

  function stockLabel(stock) {
    return ({
      in_stock: "In stock",
      low: "Low stock",
      out_of_stock: "Out of stock",
    })[stock] || "";
  }

  function renderProduct(p) {
    document.title = `${p.name} — Kiwi Flight Systems`;

    const stock = stockLabel(p.stock);
    const kicker = [p.category_label, p.sku, stock].filter(Boolean)
      .map(x => `<span>${x}</span>`).join(`<span class="dot">·</span>`);
    $("#prodKicker").innerHTML = kicker;

    $("#prodName").textContent = p.name;
    $("#prodTagline").textContent = p.tagline;
    $("#prodDescription").textContent = p.description;

    const hero = $("#heroImage");
    const thumbs = $("#thumbs");
    const imgs = p.images || [];
    if (imgs.length) {
      hero.src = imgs[0];
      hero.alt = p.name;
      thumbs.innerHTML = imgs.map((src, i) =>
        `<button type="button" data-i="${i}" aria-current="${i === 0}">
          <img src="${src}" alt="${p.name} view ${i+1}" loading="lazy" />
        </button>`
      ).join("");
      thumbs.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-i]");
        if (!b) return;
        const i = parseInt(b.getAttribute("data-i"), 10);
        hero.src = imgs[i];
        thumbs.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-current", String(x === b))
        );
      });
    }

    const body = $("#specTable tbody");
    body.innerHTML = Object.entries(p.specs || {}).map(([k, v]) =>
      `<tr><th>${k}</th><td>${v}</td></tr>`
    ).join("");

    const buyBtn = $("#buyBtn");
    if (p.shop_url) buyBtn.href = p.shop_url;
    else buyBtn.style.display = "none";

    const docs = $("#docsLink");
    if (p.docs_url) docs.href = p.docs_url;
    else docs.style.display = "none";
  }

  function notFound() {
    $("#product").innerHTML = `
      <a class="crumb" href="index.html">Back to catalog</a>
      <header class="product-head">
        <div>
          <p class="kicker">404 · Not found</p>
          <h1>No such unit</h1>
        </div>
        <p class="tagline">The product you&#39;re looking for isn&#39;t in this catalog.</p>
      </header>
    `;
  }

  fetch("products.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(data => {
      const sku = getSku();
      const p = (data.products || []).find(x => x.sku === sku);
      if (!p) { notFound(); return; }
      renderProduct(p);
    })
    .catch(() => notFound());
})();
