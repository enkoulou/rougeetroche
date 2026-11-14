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
  // en ligne : le cache normal du navigateur (les données reviennent tout de suite d'une page à l'autre, rafraîchies au plus tard toutes les 10 min) ;
  // sur cet ordinateur : toujours la dernière version, pour voir aussitôt ce que l'administration vient d'enregistrer
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const get = f => fetch(base + 'data/' + f, local ? { cache: 'no-cache' } : {}).then(r => r.json()).catch(() => null);
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

  /* ── photos : la première part tout de suite ; les autres seulement quand elles approchent de l'écran
        (un écran et demi d'avance). En attendant, l'aperçu flou écrit dans la page tient la place.
        Avant : toute la page se chargeait en chaîne, soit plus de 6 Mo dès l'accueil. ── */
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
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { lancer(x.target); io.unobserve(x.target); } }), { rootMargin: '150% 0px' });
    file.forEach(el => io.observe(el));
  } else file.forEach(lancer);
  const tete = document.querySelector('img[fetchpriority="high"]');
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
  // Le module Zenchef (service tiers) n'est chargé que lorsque le visiteur vise un bouton « Réserver » :
  // aucune connexion à Zenchef tant qu'il ne veut pas réserver.
  const zcPret = () => document.querySelector('iframe[class*="ZC_sdk"]');
  let zcCharge = false;
  const chargerZenchef = () => {
    if (zcCharge) return; zcCharge = true;
    const sdk = document.createElement('script');
    sdk.id = 'zenchef-sdk'; sdk.async = true; sdk.src = 'https://sdk.zenchef.com/v1/sdk.min.js';
    document.body.appendChild(sdk);
  };
  ['pointerenter', 'touchstart', 'focusin'].forEach(ev => document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('[data-zc-action]')) chargerZenchef(); }, { capture: true, passive: true }));
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-zc-action]');
    if (!a) return;
    if (zcPret()) { e.preventDefault(); return; }          // le module est là : il s'ouvre dans la page
    if (a.dataset.zcAttente) return;                        // second passage après l'attente : lien de secours vers Zenchef
    e.preventDefault(); e.stopPropagation();
    chargerZenchef();
    let n = 0;
    const essai = setInterval(() => {                       // on attend le module (4 s au plus), puis on rejoue le clic
      if (zcPret()) {   // le module est arrivé : on rejoue le clic jusqu'à ce que le panneau s'ouvre vraiment (5 essais)
        clearInterval(essai);
        let k = 0;
        const ouvrir = () => { const f = zcPret(); if (!f || !/zc-width-numeral/.test(f.className) || k++ > 5) return; a.click(); setTimeout(ouvrir, 450); };
        setTimeout(ouvrir, 200);
      }
      else if (++n > 26) { clearInterval(essai); a.dataset.zcAttente = '1'; location.href = a.href; }
    }, 150);
  });

  /* ── défilement : celui du navigateur, sans lissage.
        Le lissage (Lenis) a été retiré : mesuré, il retardait la page de 0,45 s à 0,9 s après chaque geste. ── */
  const lenis = null;
  if (!reduce && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    addEventListener('load', () => ScrollTrigger.refresh());
  }
  root.classList.add(reduce ? 'calme' : 'anime');
  setTimeout(() => root.classList.add('pret'), 1500);   // filet : le titre ne reste jamais masqué si un script échoue

  const ready = Promise.all([get('saisons.json'), get('plat-du-jour.json'), get('carte.json'), get('offres.json')]).then(([sc, pd, carte, offres]) => {
    let force = qs.get('saison'); try { force = force || sessionStorage.getItem('rr-saison'); } catch (_) {}
    saison = (force === 'hiver' || force === 'ete') ? force : saisonAuto(sc);
    appliquer(saison);
    const vedettes = [];
    if (carte) carte.cartes[0].sections.forEach(s => s.plats.forEach(p => { if (p.vedette) vedettes.push({ nom: p.nom[lang], prix: p.prix, photo: p.photo, rubrique: s.titre[lang] }); }));
    return { saison, pdj: platDuJour(pd), pdjHabituel: (pd && pd.prixHabituel) || null, carte, vedettes, offres, today };
  });

  /* ── signature : rouge sur fond clair (papier, écran à texte sombre), couleur papier sur une photo ou sur le sommaire ── */
  const marque = document.querySelector('.marque');
  if (marque) {
    let vu = false;
    // La photo est-elle claire à cet endroit ? On mesure la luminosité du haut ou du bas de l'image (une fois par photo).
    const mesures = new WeakMap();
    const photoClaire = (pg, bas) => {
      const im = pg.querySelector('img.ph'), src = im && (im.currentSrc || im.src);
      if (!im || !im.naturalWidth || /^data:/.test(src)) return true;
      const cle = src + (bas ? '|bas|' : '|haut|') + innerWidth + 'x' + innerHeight, m = mesures.get(im) || {};
      if (cle in m) return m[cle];
      let v = true;
      try {
        // la photo est recadrée pour remplir l'écran : on mesure la partie réellement affichée, pas l'image entière
        const W = im.clientWidth, H = im.clientHeight, nw = im.naturalWidth, nh = im.naturalHeight, k = Math.max(W / nw, H / nh);
        const vw = W / k, vh = H / k, pos = getComputedStyle(im).objectPosition.split(' ').map(parseFloat);
        const x0 = (nw - vw) * (pos[0] || 50) / 100, y0 = (nh - vh) * (pos[1] || 50) / 100, h = vh * 0.12;
        const c = document.createElement('canvas'); c.width = 16; c.height = 8;
        const x = c.getContext('2d');
        x.drawImage(im, x0, bas ? y0 + vh - h : y0, vw, h, 0, 0, 16, 8);
        const d = x.getImageData(0, 0, 16, 8).data; let s = 0;
        for (let q = 0; q < d.length; q += 4) s += 0.3 * d[q] + 0.59 * d[q + 1] + 0.11 * d[q + 2];
        v = s / (d.length / 4) > 135;
      } catch (_) {}
      m[cle] = v; mesures.set(im, m); return v;
    };
    // Que trouve-t-on sous ce point ? « papier » (fond clair du site), « clair » (bloc papier ou photo claire), ou « sombre »
    // (photo voilée, bloc rouge : pied de page, formulaire, sommaire).
    const fond = (x, y, bas) => {
      const d = document.elementsFromPoint(x, y).find(el => !el.closest('.marque, .ui'));
      if (!d) return 'papier';
      if (d.closest('.bloc')) return 'clair';
      const z = d.closest('.pg, .somm, .lb, .form, .fin, .colbar, .t-end');
      if (!z) return 'papier';
      return z.classList.contains('pg') && z.classList.contains('ink') && photoClaire(z, bas) ? 'clair' : 'sombre';
    };
    const teinte = () => {
      vu = false;
      const r = marque.getBoundingClientRect();
      const haut = fond(r.left + r.width / 2, r.top + r.height / 2, false);
      const bas = fond(r.left + 20, innerHeight - 24, true);
      marque.classList.toggle('clair', haut !== 'sombre');        // signature rouge sur fond clair, couleur papier sur fond sombre
      root.classList.toggle('papier', haut === 'papier');         // sur le papier, l'en-tête reçoit un fond plein (voir site.css)
      root.classList.toggle('haut-clair', haut !== 'sombre');     // menu du haut : encre sur fond clair, papier sur fond sombre
      root.classList.toggle('bas-clair', bas !== 'sombre');       // idem pour la ligne du bas (numéro d'écran, bouton de saison)
    };
    const plusTard = () => { if (!vu) { vu = true; setTimeout(teinte, 60); } };
    addEventListener('scroll', plusTard, { passive: true }); addEventListener('resize', plusTard);
    document.addEventListener('click', () => setTimeout(teinte, 60)); document.addEventListener('transitionend', plusTard); document.addEventListener('load', plusTard, true);   // une photo vient d'arriver : on remesure
    teinte();
  }

  /* ── page suivante : préparée seulement quand le visiteur vise son lien (survol, doigt posé, tabulation).
        Avant : les cinq autres pages et leur grande photo étaient chargées d'office. ── */
  const cfgP = (window.RRcfg && RRcfg.pages) || [], cx = navigator.connection, dejaVu = new Set();
  const viser = e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    const p = cfgP.find(x => a.getAttribute('href').split('#')[0] === x[0]); if (!p || dejaVu.has(p[0])) return;
    if (cx && (cx.saveData || /2g/.test(cx.effectiveType || ''))) return;   // on respecte les forfaits serrés
    dejaVu.add(p[0]);
    fetch(p[0], { credentials: 'same-origin', priority: 'low' }).catch(() => {});
    const n = p[saison === 'hiver' ? 1 : 2], m = n.slice(0, -2), dir = base + 'assets/img/', im = new Image();
    im.sizes = '100vw'; im.srcset = dir + m + '.jpg 1000w, ' + dir + m + '-m.jpg 1400w, ' + dir + n + '.jpg 2000w'; im.src = dir + m + '.jpg';
  };
  ['pointerenter', 'touchstart', 'focusin'].forEach(ev => document.addEventListener(ev, viser, { capture: true, passive: true }));

  window.RR = { ready, euro, lang, base, reduce, anime: !reduce && !!window.gsap && !!window.ScrollTrigger, lenis, get saison() { return saison; } };
})();
