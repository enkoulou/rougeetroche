/* Rouge et Roche v2 — socle commun à toutes les pages.
   Lit les fichiers de données (data/*.json) et fournit :
   - l'ambiance de saison (hiver / été) avec bascule automatique et bouton,
   - le plat du jour (jamais un plat d'une autre date),
   - la réservation Zenchef,
   - le défilement fluide (Lenis) branché sur GSAP.
   Chaque page s'abonne avec  RR.ready.then(({saison, pdj, carte}) => …)  */
(function () {
  const root = document.documentElement;
  try { history.scrollRestoration = 'manual'; } catch (_) {}   // une page s'ouvre toujours en haut
  if (!location.hash) scrollTo(0, 0);
  const base = document.body.dataset.base || '';
  const lang = root.lang === 'en' ? 'en' : 'fr';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]calme=/.test(location.search);   // ?calme=1 : pour tester sans animations
  const qs = new URLSearchParams(location.search);
  const get = f => fetch(base + 'data/' + f, { cache: 'no-cache' }).then(r => r.json()).catch(() => null);
  const euro = n => lang === 'en' ? '€' + (Number.isInteger(n) ? n : n.toFixed(2)) : (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')) + ' €';
  const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

  /* ── saison ── */
  function saisonAuto(cfg) {
    if (cfg && cfg.forcer) return cfg.forcer;
    const md = today.slice(5), a = (cfg && cfg.debutHiver) || '10-15', b = (cfg && cfg.finHiver) || '04-14';
    const hiver = a <= b ? (md >= a && md <= b) : (md >= a || md <= b);
    return hiver ? 'hiver' : 'ete';
  }
  function appliquer(s) {
    root.dataset.saison = s;
    // images et fonds qui changent avec la saison : data-hiver="…" data-ete="…"
    document.querySelectorAll('[data-hiver][data-ete]').forEach(el => {
      const v = el.dataset[s];
      if (el.tagName === 'IMG') { if (el.getAttribute('src') !== v) el.src = v; }
      else if (el.hasAttribute('data-bg')) el.style.backgroundImage = 'url(' + v + ')';
      else el.textContent = v;
    });
    // photos du site final : data-h="o001-l" data-e="j013-l" (nom du fichier sans extension ; « -l » = grande taille)
    document.querySelectorAll('img[data-h][data-e]').forEach(el => {
      const n = el.dataset[s === 'hiver' ? 'h' : 'e'], big = n.endsWith('-l'), dir = base + 'assets/img/';
      const src = dir + (big ? n.slice(0, -2) : n) + '.jpg';
      if (big) { el.srcset = src + ' 1000w, ' + dir + n.slice(0, -2) + '-m.jpg 1400w, ' + dir + n + '.jpg 2000w'; el.sizes = el.dataset.sizes || '100vw'; }
      if (el.getAttribute('src') !== src) el.src = src;
      const alt = el.dataset[s === 'hiver' ? 'altH' : 'altE']; if (alt !== undefined) el.alt = alt;
    });
    document.dispatchEvent(new CustomEvent('saison', { detail: s }));
  }
  let saison = 'hiver';
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bascule]');
    if (!b) return;
    saison = saison === 'hiver' ? 'ete' : 'hiver';
    try { sessionStorage.setItem('rr-saison', saison); } catch (_) {}
    appliquer(saison);
  });

  /* ── plat du jour ── */
  function platDuJour(d) {
    if (qs.get('exemple')) return { exemple: true, nom: { fr: 'EXEMPLE — nom du plat du jour', en: 'EXAMPLE — dish of the day' }, prix: 0, photo: '' };
    const p = d && (d.plats || []).find(x => x.date === today);
    return p || null;
  }

  /* ── Zenchef : le widget s'ouvre dans la page ; son bouton flottant par défaut est masqué
        parce que le site a son propre bouton « Réserver », toujours visible ── */
  const zcId = document.body.dataset.zenchef || '367179';
  const st = document.createElement('style');
  st.textContent = 'iframe[class*="zc-width-numeral"]{visibility:hidden!important;pointer-events:none!important}';
  document.head.appendChild(st);
  const cfgEl = document.createElement('div');
  cfgEl.className = 'zc-widget-config'; cfgEl.dataset.restaurant = zcId; cfgEl.dataset.lang = lang;
  document.body.appendChild(cfgEl);
  const sdk = document.createElement('script');
  sdk.id = 'zenchef-sdk'; sdk.async = true; sdk.src = 'https://sdk.zenchef.com/v1/sdk.min.js';
  document.body.appendChild(sdk);
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-zc-action]');
    if (a && document.querySelector('iframe[class*="ZC_sdk"]')) e.preventDefault();   // sinon : lien de secours vers Zenchef
  });

  /* ── défilement fluide ── */
  let lenis = null;
  if (!reduce && window.gsap && window.Lenis && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    addEventListener('load', () => ScrollTrigger.refresh());
  }
  root.classList.add(reduce ? 'calme' : 'anime');

  const ready = Promise.all([get('saisons.json'), get('plat-du-jour.json'), get('carte.json'), get('offres.json')]).then(([sc, pd, carte, offres]) => {
    let force = qs.get('saison'); try { force = force || sessionStorage.getItem('rr-saison'); } catch (_) {}
    saison = (force === 'hiver' || force === 'ete') ? force : saisonAuto(sc);
    appliquer(saison);
    const vedettes = [];
    if (carte) carte.cartes[0].sections.forEach(s => s.plats.forEach(p => { if (p.vedette) vedettes.push({ nom: p.nom[lang], prix: p.prix, photo: p.photo, rubrique: s.titre[lang] }); }));
    return { saison, pdj: platDuJour(pd), carte, vedettes, offres, today };
  });

  window.RR = { ready, euro, lang, base, reduce, anime: !reduce && !!window.gsap && !!window.ScrollTrigger, lenis, get saison() { return saison; } };
})();
