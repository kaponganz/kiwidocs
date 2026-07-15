(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const entries = $("#entries");

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  function stockLabel(stock) {
    return ({
      in_stock: "In stock",
      low: "Low stock",
      out_of_stock: "Out of stock",
    })[stock] || "";
  }

  function entry(p, i) {
    const img = (p.images && p.images[0]) || "";
    const specs = (p.highlight_specs || []).map(s =>
      `<dt>${s.label}</dt><dd>${s.value}</dd>`
    ).join("");
    const stock = stockLabel(p.stock);
    const meta = [p.category_label, p.sku, stock].filter(Boolean)
      .map(x => `<span>${x}</span>`).join(`<span class="dot">·</span>`);

    return `
      <article class="entry" data-sku="${p.sku}" data-stagger="${Math.min(2 + i, 6)}">
        <figure class="entry-figure">
          <img src="${img}" alt="${p.name}" loading="lazy" />
          <figcaption>Fig. ${ROMAN[i] || (i+1)}</figcaption>
        </figure>
        <div class="entry-body">
          <span class="numeral" aria-hidden="true">${ROMAN[i] || (i+1)}</span>
          <p class="kicker">${meta}</p>
          <h2 class="name"><a href="product.html?sku=${encodeURIComponent(p.sku)}">${p.name}</a></h2>
          <p class="tagline">${p.tagline}</p>
          <dl class="specs">${specs}</dl>
          <p class="actions">
            <a class="link-buy" href="${p.shop_url}" target="_blank" rel="noopener">Buy on kiwidrone.com.ua</a>
            <a class="link-more" href="product.html?sku=${encodeURIComponent(p.sku)}">Read more</a>
          </p>
        </div>
      </article>
    `;
  }

  fetch("products.json", { cache: "no-cache" })
    .then(r => {
      if (!r.ok) throw new Error("Failed to load catalog");
      return r.json();
    })
    .then(data => {
      const products = data.products || [];
      const verEl = $("#catalogVersion");
      if (verEl && data.meta && data.meta.catalog_version) {
        verEl.textContent = `№ ${data.meta.catalog_version}`;
      }
      entries.innerHTML = products.map(entry).join("");
    })
    .catch(err => {
      entries.innerHTML = `<p style="padding:2rem 0;color:var(--accent);font-style:italic">Could not load the catalog: ${err.message}</p>`;
    });
})();
