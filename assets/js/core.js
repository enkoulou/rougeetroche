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
      const src = dir + (big ? n.slice(0, -2) : n) + '.jpg', file = el.hasAttribute('data-q');
      // la photo du haut va jusqu'à 2000 px ; les autres s'arrêtent à 1400 px (trois fois plus légères)
      const ss = big ? src + ' 1000w, ' + dir + n.slice(0, -2) + '-m.jpg 1400w' + (file ? '' : ', ' + dir + n + '.jpg 2000w') : '';
      if (big) el.sizes = el.dataset.sizes || '100vw';
      if (file && el.dataset.q !== 'ok') {   // pas encore son tour : l'aperçu flou tient la place
        el.dataset.src = src; if (ss) el.dataset.srcset = ss;
        const ap = el.dataset[s === 'hiver' ? 'lh' : 'le']; if (ap && el.getAttribute('src') !== ap) el.src = ap;
      }
      else { if (ss && el.getAttribute('srcset') !== ss) el.srcset = ss; if (el.getAttribute('src') !== src) el.src = src; }
      const alt = el.dataset[s === 'hiver' ? 'altH' : 'altE']; if (alt !== undefined) el.alt = alt;
    });
    document.dispatchEvent(new CustomEvent('saison', { detail: s }));
  }
  let saison = root.dataset.saison === 'ete' ? 'ete' : 'hiver';   // déjà calculée par le script en tête de page
  appliquer(saison);   // les photos de saison partent tout de suite, sans attendre les fichiers de données

  /* ── file d'attente des photos : la première photo d'abord, puis les suivantes dans l'ordre de la page,
        deux à la fois ; une photo qui approche de l'écran passe devant ── */
  const lancer = el => {
    if (el.dataset.q === 'ok') return;
    el.dataset.q = 'ok';
    el.addEventListener('load', () => el.classList.add('vu'), { once: true });
    if (el.dataset.srcset) el.srcset = el.dataset.srcset;
    if (el.dataset.src) el.src = el.dataset.src;
    if (el.complete && el.naturalWidth) el.classList.add('vu');
  };
  const file = [...document.querySelectorAll('img[data-q]')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { lancer(x.target); io.unobserve(x.target); } }), { rootMargin: '120% 0px' });
    file.forEach(el => io.observe(el));
  }
  let fileLancee = false;
  const suite = () => {
    const el = file.find(x => x.dataset.q !== 'ok');
    if (!el) return;
    lancer(el);
    if (el.complete) suite(); else { el.addEventListener('load', suite, { once: true }); el.addEventListener('error', suite, { once: true }); }
  };
  const demarrer = () => { if (fileLancee) return; fileLancee = true; suite(); suite(); };
  const tete = document.querySelector('img[fetchpriority="high"]');
  if (!tete || (tete.complete && tete.naturalWidth)) setTimeout(demarrer, 0);
  else { tete.addEventListener('load', demarrer, { once: true }); tete.addEventListener('error', demarrer, { once: true }); setTimeout(demarrer, 2500); }
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

  /* ── signature : rouge sur fond clair (papier, écran à texte sombre), couleur papier sur une photo ou sur le sommaire ── */
  const marque = document.querySelector('.marque');
  if (marque) {
    let vu = false;
    const teinte = () => {
      vu = false;
      const r = marque.getBoundingClientRect();
      const dessous = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find(el => !el.closest('.marque, .ui'));
      const z = dessous && dessous.closest('.pg, .somm, .lb');
      marque.classList.toggle('clair', !z || (z.classList.contains('pg') && z.classList.contains('ink')));
    };
    const plusTard = () => { if (!vu) { vu = true; setTimeout(teinte, 60); } };
    addEventListener('scroll', plusTard, { passive: true }); addEventListener('resize', plusTard);
    document.addEventListener('click', () => setTimeout(teinte, 60)); document.addEventListener('transitionend', plusTard);
    teinte();
  }

  /* ── pages suivantes : une fois cette page affichée et au repos, on met de côté les autres pages
        et leur première photo. Le passage d'une page à l'autre se fait alors sans attente. ── */
  const cfgP = (window.RRcfg && RRcfg.pages) || [], cx = navigator.connection;
  const avance = () => {
    if (cx && (cx.saveData || /2g/.test(cx.effectiveType || ''))) return;   // on respecte les forfaits serrés
    let i = 0;
    const un = () => {
      const p = cfgP[i++]; if (!p) return;
      fetch(p[0], { credentials: 'same-origin', priority: 'low' }).catch(() => {});
      const n = p[saison === 'hiver' ? 1 : 2], m = n.slice(0, -2), dir = base + 'assets/img/', im = new Image();
      im.onload = im.onerror = un; im.fetchPriority = 'low';
      im.sizes = '100vw'; im.srcset = dir + m + '.jpg 1000w, ' + dir + m + '-m.jpg 1400w, ' + dir + n + '.jpg 2000w'; im.src = dir + m + '.jpg';
    };
    un();
  };
  // départ : une seconde après l'arrivée de la première photo, sans attendre le reste de la page ; en basse priorité
  let avanceFaite = false;
  const repos = () => { if (avanceFaite) return; avanceFaite = true; setTimeout(avance, 1000); };
  if (!tete || (tete.complete && tete.naturalWidth)) repos();
  else { tete.addEventListener('load', repos, { once: true }); setTimeout(repos, 4000); }

  window.RR = { ready, euro, lang, base, reduce, anime: !reduce && !!window.gsap && !!window.ScrollTrigger, lenis, get saison() { return saison; } };
})();
