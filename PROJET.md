# Rouge et Roche — refonte v2 : le projet posé par écrit

## Ce qui rend le lieu unique
Un restaurant posé sur le sable de la Pointe Rouge, ouvert toute l'année, tous les jours de 8 h à 22 h, avec une salle au chaud d'où l'on voit la mer et une terrasse couverte. (On ne parle pas des restaurants voisins : demande du client.)

## À qui le site s'adresse
1. Les Marseillais qui cherchent où déjeuner ou dîner au bord de l'eau hors saison (objectif n°1 : remplir l'hiver).
2. Les groupes : repas d'entreprise, anniversaires, fêtes de fin d'année.
3. Les visiteurs l'été, qui réservent depuis leur téléphone.

## Ce que le visiteur doit ressentir et faire
Ressentir : « c'est ouvert, c'est beau, j'y serais bien ce midi ». Faire : réserver (Zenchef, toujours visible) ou appeler.

## Parcours de la page d'accueil, écran par écran
1. Le lieu en une image, le nom, « ouvert toute l'année », Réserver.
2. Le fait : ouvert tous les jours, toute l'année, de 8 h à 22 h.
3. L'espace de la saison (hiver : la salle / été : la terrasse).
4. La carte du moment : quelques plats et leurs prix.
5. Le plat du jour.
6. L'autre espace (hiver : « La terrasse, dès qu'il fait beau » / été : la salle).
7. Les rendez-vous : Noël, afterwork.
8. Groupes et privatisation.
9. Venir : adresse, téléphone, horaires, bus, Réserver.

## Tri des photos
250 photos uniques, 89 retenues et retouchées de la même façon (dossier `assets/img`, préfixe `o` = octobre, `j` = juillet).
Écartées : les doublons, les floues, et toutes celles où le store rayé du voisin domine.

## Ce qui manque pour atteindre le niveau visé
- Aucune photo horizontale : sur ordinateur, le plein écran se fait en recadrant des photos verticales.
- Aucune vraie image d'hiver : salle pleine un soir de janvier, mer grise, lumières allumées.
- Pas de vidéo d'origine (seulement des enregistrements d'écran Instagram).
- Pas de façade sans le store du voisin, pas de portrait de l'équipe ou de la cuisine.
- Pas de photo des pizzas, des planches et croque-monsieur de l'afterwork, ni d'un événement privé.

## Les quatre partis pris (dossier `directions/`)
1. `1-magazine.html` + `1-magazine-carte.html` — Le magazine (piste poussée)
2. `2-roche.html` + `2-roche-carte.html` — La roche (piste poussée)
3. ~~Le carnet marseillais~~ — écarté par le client le 14 novembre 2026 (fichier mis à la corbeille)
4. `4-ligne.html` — La ligne d'eau (carte blanche), gardée en réserve

## Données (dossier `data/`)
`carte.json`, `plat-du-jour.json`, `saisons.json`, `horaires.json`, `offres.json`, `site.json`.
Ajouter `?saison=ete` ou `?saison=hiver` à l'adresse force une ambiance ; `?exemple=1` montre l'encart plat du jour rempli.
