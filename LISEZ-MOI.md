# Rouge et Roche — site v2 « Le magazine »

L'ancien site est intact dans `../v1-archive/`. Rien n'est en ligne.

## Voir le site sur cet ordinateur
Dans le Terminal, depuis le dossier du projet (`rouge-et-roche-site`) :

    python3 -m http.server 8090

puis ouvrir http://localhost:8090/v2/ dans le navigateur.

## La page d'administration (plat du jour, carte, offres, saisons)
Ouvrir http://localhost:8090/v2/admin/ **dans Chrome ou Edge**, cliquer sur « Choisir le dossier data » et sélectionner le dossier `v2/data`.
Ensuite, chaque « Enregistrer » écrit directement dans les fichiers du site : le changement est visible dès qu'on recharge une page.
- Plat du jour : un plat par date, saisi à l'avance si on veut ; « Retirer les plats passés » fait le ménage.
- La carte : noms, prix, ajout et retrait de plats, plats mis en avant sur l'accueil.
- Hiver / été : dates de bascule, ou une ambiance imposée.

Sans le dossier relié (Safari, Firefox), « Enregistrer » télécharge les fichiers : il faut alors les copier à la main dans `v2/data`.
- Les offres : prix, horaires, jour de l'afterwork, dates et plats du menu de Noël, et « Afficher sur le site » pour retirer une offre. Le menu de Noël disparaît seul après sa date de fin.

## Ce qui se modifie sans rien régénérer
| Fichier | Sert à |
|---|---|
| `data/carte.json` | La carte, les boissons, les vins, les prix. `"vedette": true` met un plat en avant. |
| `data/plat-du-jour.json` | Le plat du jour : une entrée par date (`AAAA-MM-JJ`). Seul le plat du jour même s'affiche ; sinon le site écrit « Plat du jour chaque midi, demandez-le en salle ». |
| `data/offres.json` | Le petit-déjeuner, le menu de Noël et l'afterwork. |
| `data/saisons.json` | Les dates de bascule hiver / été (`debutHiver`, `finHiver`). `"forcer": "ete"` impose une ambiance. |

## Ce qui demande de régénérer les pages
Après avoir modifié `data/site.json` (téléphone, e-mail, capacités) ou `data/horaires.json`, ou un texte dans `outils/build.py` :

    python3 outils/build.py

## Pour tester
- `?saison=ete` ou `?saison=hiver` à la fin de l'adresse force une ambiance.
- `?exemple=1` affiche l'encart plat du jour rempli avec un faux plat marqué « EXEMPLE ».

## Ce qui manque encore (encarts jaunes, page Mentions légales)
- La ville d'immatriculation au RCS.
- Le nom du directeur de la publication.
- L'hébergeur, à renseigner au moment de la mise en ligne.

## Préparer la mise en ligne
Voir `MISE-EN-LIGNE.md`. Le dossier à déposer se prépare avec `python3 outils/dossier-en-ligne.py` (résultat : `en-ligne/`).

## Dossiers
- `index.html`, `carte.html`, `offres.html`, `privatisation.html`, `galerie.html`, `acces.html` : pages françaises ; `en/` : pages anglaises.
- `assets/` : styles, scripts, polices, photos retouchées (`-l` = grande taille).
- `directions/` : les pages de test des partis pris (non référencées).
- `PROJET.md` : le plan du projet et le tri des photos.
