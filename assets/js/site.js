/* Rouge et Roche v2 — comportements des pages (le socle est dans core.js).
   Tout mouvement est coupé si le visiteur a demandé moins d'animations. */
(function () {
  const en = RR.lang === 'en';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const L = o => (o && (o[RR.lang] || o.fr)) || '';
  const prix = p => p == null ? '<span class="todo">' + (en ? 'Price to come' : 'Prix à venir') + '</span>'
    : typeof p === 'object' ? Object.entries(p).map(([k, v]) => `<i><small>${esc(k)}</small>${RR.euro(v)}</i>`).join('') : RR.euro(p);
  const cfg = window.RRcfg || {};

  /* ── sommaire ── */
  const somm = $('#somm'), sb = $('[data-somm]');
  if (somm && sb) {
    const set = o => {
      somm.classList.toggle('on', o); somm.setAttribute('aria-hidden', !o);
      sb.textContent = o ? (en ? 'Close' : 'Fermer') : (en ? 'Contents' : 'Sommaire'); sb.setAttribute('aria-expanded', o);
      if (RR.lenis) o ? RR.lenis.stop() : RR.lenis.start();
      document.body.style.overflow = o ? 'hidden' : '';
    };
    sb.addEventListener('click', () => set(!somm.classList.contains('on')));
    somm.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ── numéro et mois (couverture) ── */
  const d = new Date();
  $$('[data-num]').forEach(e => e.textContent = String(d.getMonth() + 1).padStart(2, '0'));
  $$('[data-mois]').forEach(e => e.textContent = d.toLocaleDateString(en ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' }));

  /* ── galerie ── */
  const gal = $('.gal');
  if (gal) {
    const items = $$('button', gal), lb = $('.lb'), im = $('img', lb), cnt = $('.cnt', lb);
    $$('.filt button').forEach(b => b.addEventListener('click', () => {
      $$('.filt button').forEach(x => x.setAttribute('aria-pressed', x === b));
      const all = b.dataset.f === 'all';
      gal.classList.toggle('flat', !all);
      items.forEach(it => it.classList.toggle('hide', !all && it.dataset.c !== b.dataset.f));
      if (RR.anime) { gsap.fromTo(items.filter(i => !i.classList.contains('hide')), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'power3.inOut', stagger: 0.04 }); ScrollTrigger.refresh(); }
    }));
    let cur = 0;
    const vis = () => items.filter(i => !i.classList.contains('hide'));
    const open = i => { const v = vis(); cur = (i + v.length) % v.length; im.src = v[cur].dataset.full; im.alt = $('img', v[cur]).alt; cnt.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(v.length).padStart(2, '0'); lb.classList.add('open'); if (RR.lenis) RR.lenis.stop(); };
    const close = () => { lb.classList.remove('open'); if (RR.lenis) RR.lenis.start(); };
    items.forEach(it => it.addEventListener('click', () => open(vis().indexOf(it))));
    $('.x', lb).addEventListener('click', close);
    $('.pv', lb).addEventListener('click', () => open(cur - 1));
    $('.nx', lb).addEventListener('click', () => open(cur + 1));
    addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') open(cur - 1); if (e.key === 'ArrowRight') open(cur + 1); });
  }

  /* ── formulaire de demande (privatisation) ── */
  const form = $('form.dem');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('.form-msg', form), data = new FormData(form);
    const say = h => { msg.innerHTML = h; msg.classList.add('show'); };
    if (data.get('site')) return;                          // champ piège anti-robots
    if (!form.reportValidity()) return;
    const tel = `<a href="tel:${cfg.telLien}">${cfg.tel}</a>`;
    const T = en ? { ok: 'Thank you. Your request has been sent; we will come back to you shortly.', ko: 'Sending failed. Please call us on ', mail: 'Your e-mail app is opening with the request ready to send.', none: 'FORM NOT CONNECTED YET — the restaurant e-mail address is missing (data/site.json). In the meantime, call ' }
      : { ok: 'Merci. Votre demande est envoyée, nous revenons vers vous très vite.', ko: "L'envoi a échoué. Appelez-nous au ", mail: 'Votre messagerie s’ouvre avec la demande prête à envoyer.', none: 'FORMULAIRE PAS ENCORE RELIÉ — il manque l’adresse e-mail du restaurant (data/site.json). En attendant, appelez le ' };
    if (cfg.formEndpoint) {
      try { const r = await fetch(cfg.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } }); if (!r.ok) throw 0; form.reset(); say(T.ok); } catch (_) { say(T.ko + tel + '.'); }
    } else if (cfg.email) {
      const body = [...data.entries()].filter(([k]) => k !== 'site' && k !== 'consent').map(([k, v]) => k + ' : ' + v).join('\n');
      location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent((en ? 'Group request — ' : 'Demande de groupe — ') + data.get('nom')) + '&body=' + encodeURIComponent(body);
      say(T.mail);
    } else say('<span class="todo">' + T.none + '</span> ' + tel + '.');
  });

  /* ── offres : textes recalculés depuis data/offres.json (mêmes règles que offres_txt() dans outils/build.py) ── */
  const JOURS = { lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday' };
  const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function offresTxt(O) {
    const by = id => O.offres.find(x => x.id === id), pd = by('petit-dejeuner'), no = by('noel'), aw = by('afterwork');
    const heure = x => { const h = +x.slice(0, 2), m = x.slice(3, 5); return en ? (h % 12 || 12) + (m === '00' ? '' : ':' + m) + (h < 12 ? ' am' : ' pm') : h + ' h' + (m === '00' ? '' : ' ' + m); };
    const date = d => { const mo = +d.slice(5, 7), j = +d.slice(8, 10); return en ? j + ' ' + MOIS_EN[mo - 1] : (j === 1 ? '1er' : j) + ' ' + MOIS_FR[mo - 1]; };
    const jour = en ? JOURS[aw.jour] : aw.jour;
    const nd = en ? date(no.dates.debut) + ' to ' + date(no.dates.fin) : 'du ' + date(no.dates.debut) + ' au ' + date(no.dates.fin);
    const groupes = no.composition.map(g => { const n = g.plats.map(p => L(p).split(',')[0].trim()).filter(Boolean); return n.map((x, i) => i ? x.charAt(0).toLowerCase() + x.slice(1) : x).join(en ? ' or ' : ' ou ') + '.'; });
    return {
      'pd-chip': (en ? 'Breakfast ' : 'Petit-déjeuner ') + RR.euro(pd.prix), 'pd-prix': RR.euro(pd.prix), 'pd-resume': L(pd.resume),
      'pd-heure': (en ? 'From ' : 'À partir de ') + heure(pd.heure), 'pd-quand': L(pd.quand),
      'no-chip': (en ? 'Christmas menu ' : 'Menu de Noël ') + RR.euro(no.prix), 'no-prix': RR.euro(no.prix), 'no-dates': nd, 'no-dates-c': nd.charAt(0).toUpperCase() + nd.slice(1),
      'no-court': (en ? 'Starter, main, dessert. ' : 'Entrée, plat, dessert. ') + groupes.join(' '),
      'aw-chip': en ? 'Afterwork on ' + jour + 's' : 'Afterwork le ' + jour, 'aw-jour-h': en ? jour + 's,' : 'Le ' + jour + ',',
      'aw-heures': heure(aw.debut) + ' – ' + heure(aw.fin) + '.', 'aw-quand': en ? 'every ' + jour : 'tous les ' + jour + 's', 'aw-quand-c': en ? 'Every ' + jour : 'Tous les ' + jour + 's',
      'aw-de': en ? heure(aw.debut) + ' to ' + heure(aw.fin) : 'De ' + heure(aw.debut) + ' à ' + heure(aw.fin),
      'aw-resume': L(aw.resume), 'aw-fin': en ? 'See you ' + jour + '?' : 'À ' + jour + ' ?',
      'no-cols': no.composition.map(g => `<div><h3>${esc(L(g.titre))}</h3><ul>${g.plats.map(p => `<li>${esc(L(p))}</li>`).join('')}</ul></div>`).join('')
    };
  }
  function appliquerOffres(O, today) {
    if (!O || !O.offres) return;
    try {
      const T = offresTxt(O);
      $$('[data-o]').forEach(e => { const v = T[e.dataset.o]; if (v === undefined) return; if (e.dataset.o === 'no-cols') e.innerHTML = v; else e.textContent = v; });
    } catch (_) { /* fichier incomplet : on garde les textes de la page */ }
    O.offres.forEach(x => {   // offre désactivée, ou menu de Noël passé : retirée du site
      const off = x.actif === false || (x.dates && x.dates.fin && today > x.dates.fin);
      $$(`[data-offre="${x.id}"]`).forEach(e => { e.hidden = off; });
    });
  }

  RR.ready.then(({ pdj, carte, vedettes, offres, today }) => {
    appliquerOffres(offres, today);
    /* ── plat du jour : uniquement celui de la date du jour ── */
    if (pdj) {
      $$('[data-pdj-nom]').forEach(e => e.textContent = L(pdj.nom));
      $$('[data-pdj-txt]').forEach(e => e.textContent = (pdj.prix ? RR.euro(pdj.prix) + ' — ' : '') + (en ? 'served this lunchtime.' : 'servi ce midi.'));
      if (pdj.photo) $$('[data-pdj-im]').forEach(e => { e.hidden = false; e.innerHTML = `<img src="${RR.base}assets/img/${esc(pdj.photo)}.jpg" alt="">`; });
    }
    /* ── plat mis en avant sur l'accueil (prix lu dans la carte) ── */
    const vd = vedettes.find(v => v.photo === 'o094');
    if (vd) { $$('[data-plat]').forEach(e => e.textContent = vd.nom.split(',')[0]); $$('[data-plat-prix]').forEach(e => e.textContent = RR.euro(vd.prix)); $$('[data-plat-rub]').forEach(e => e.textContent = vd.rubrique); }

    /* ── page Carte ── */
    const menu = $('#menu'), tabs = $('#tabs');
    if (menu && carte) {
      const VUES = { carte: { 0: ['o093-l', en ? 'Sole meunière' : 'Sole meunière', '60% 40%'], 2: ['o082-l', en ? 'Rock fish soup' : 'Soupe de poissons de roche', '50% 55%'], 4: ['o123-l', 'Tarte tatin', '50% 50%'] }, boissons: { 0: ['j065-l', 'Basilic Smash', '50% 45%'] }, vins: {} };
      tabs.innerHTML = carte.cartes.map((c, i) => `<button class="u" role="tab" aria-selected="${!i}" data-id="${c.id}">${esc(L(c.titre))}</button>`).join('');
      const voir = id => {
        const c = carte.cartes.find(x => x.id === id) || carte.cartes[0];
        $$('button', tabs).forEach(b => b.setAttribute('aria-selected', b.dataset.id === c.id));
        menu.innerHTML = c.sections.map((s, i) => {
          const v = (VUES[c.id] || {})[i];
          return `<section class="rub"><h2><span class="m"><span>${esc(L(s.titre))}</span></span>${s.prixSection ? `<small>${RR.euro(s.prixSection)}</small>` : ''}</h2>
            <div class="corps">${s.aCompleter ? `<p class="todo">${esc(L(s.note))}</p>` : (s.note ? `<p class="note">${esc(L(s.note))}</p>` : '')}
            <div class="liste">${s.plats.map(p => `<div class="li"><span>${esc(L(p.nom))}</span><b>${prix(p.prix)}</b></div>`).join('')}</div></div></section>`
            + (v ? `<figure class="vue" style="--pos:${v[2]}"><img src="${RR.base}assets/img/${v[0].slice(0, -2)}.jpg" srcset="${RR.base}assets/img/${v[0].slice(0, -2)}.jpg 1000w, ${RR.base}assets/img/${v[0].slice(0, -2)}-m.jpg 1400w, ${RR.base}assets/img/${v[0]}.jpg 2000w" sizes="100vw" alt="${esc(v[1])}" loading="lazy"><span class="u">${esc(v[1])}</span></figure>` : '');
        }).join('');
        if (!RR.anime) return;
        ScrollTrigger.getAll().filter(s => s.vars.id === 'rub').forEach(s => s.kill());
        $$('.rub', menu).forEach(r => {
          gsap.from($('.m>span', r), { yPercent: 115, duration: 1.4, ease: 'expo.out', scrollTrigger: { id: 'rub', trigger: r, start: 'top 82%' } });
          const l = $$('.li', r); if (l.length) gsap.from(l, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut', stagger: 0.06, scrollTrigger: { id: 'rub', trigger: $('.liste', r), start: 'top 88%' } });
        });
        $$('.vue img', menu).forEach(i => gsap.fromTo(i, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { id: 'rub', trigger: i.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
        ScrollTrigger.refresh();
      };
      tabs.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        voir(b.dataset.id); history.replaceState(null, '', '#' + b.dataset.id);
        const y = tabs.getBoundingClientRect().top + scrollY; RR.lenis ? RR.lenis.scrollTo(y, { duration: 1 }) : scrollTo(0, y);
      });
      voir(location.hash.slice(1));
    } else if (menu) menu.innerHTML = '<p class="todo" style="margin:40px var(--g)">data/carte.json introuvable</p>';

    /* ════════ mouvement ════════ */
    const pages = $$('.stack .pg').filter(p => !p.hidden), fol = $('#fol');
    if (fol) $('#tot').textContent = String(pages.length).padStart(2, '0');
    const folio = i => { if (fol) fol.textContent = String(i + 1).padStart(2, '0'); };
    if (!RR.anime) {
      if (fol) addEventListener('scroll', () => folio(Math.min(pages.length - 1, Math.round(scrollY / innerHeight))), { passive: true });
      return;
    }
    const lignes = (root, st, delay) => {
      const l = $$('.m>span', root), small = $$('.tx p:not(.now), .tx .go, .tx dl, .tx .cta, .tx>.u, .issue', root);
      const tl = gsap.timeline({ paused: !!st, defaults: { ease: 'expo.out' }, delay: delay || 0 })
        .from(l, { yPercent: 115, duration: 1.5, stagger: 0.12 })
        .from(small, { y: 26, clipPath: 'inset(0 0 100% 0)', duration: 1.1, stagger: 0.08 }, 0.35);
      return tl;
    };
    /* accueil : chaque page recouvre la précédente, la photo se pose lentement */
    pages.forEach((pg, i) => {
      const ph = $('.ph', pg);
      if (i) gsap.fromTo(ph, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: pg, start: 'top bottom', end: 'top top', scrub: true } });
      gsap.to(ph, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: pg, start: 'bottom bottom', end: 'bottom top', scrub: true } });
      const tl = lignes(pg, i > 0);
      if (i) ScrollTrigger.create({ trigger: pg, start: 'top 45%', onEnter: () => tl.play(), onLeaveBack: () => tl.reverse() });
      else gsap.fromTo(ph, { scale: 1.25 }, { scale: 1, duration: 2.6, ease: 'power3.out' });
      ScrollTrigger.create({ trigger: pg, start: 'top 50%', end: 'bottom 50%', onToggle: s => { if (s.isActive) folio(i); } });
    });
    /* pages intérieures : couverture, puis écrans isolés */
    $$('.pg:not(.stack .pg)').forEach(pg => {
      const ph = $('.ph', pg), cov = pg.classList.contains('cov');
      if (cov) { gsap.fromTo(ph, { scale: 1.22 }, { scale: 1, duration: 2.6, ease: 'power3.out' }); lignes(pg, false, 0.15); gsap.to(ph, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: pg, start: 'top top', end: 'bottom top', scrub: true } }); }
      else {
        gsap.fromTo(ph, { scale: 1.16, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: pg, start: 'top bottom', end: 'bottom top', scrub: true } });
        const tl = lignes(pg, true); ScrollTrigger.create({ trigger: pg, start: 'top 55%', onEnter: () => tl.play(), onLeaveBack: () => tl.reverse() });
      }
    });
    /* blocs sur papier : les titres montent, les listes se déroulent */
    $$('.det, .prose, .nums, .infos, .form, .fin').forEach(b => {
      const l = $$('.m>span', b); if (l.length) gsap.from(l, { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: b, start: 'top 80%' } });
      const rows = $$('li, dl div, .nums div', b).filter(x => !x.closest('.somm'));
      if (rows.length) gsap.from(rows, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut', stagger: 0.07, scrollTrigger: { trigger: rows[0], start: 'top 88%' } });
    });
    if (gal) gsap.from($$('button', gal), { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'power3.inOut', stagger: 0.05, delay: 0.3 });
    ScrollTrigger.refresh();
  });
})();
