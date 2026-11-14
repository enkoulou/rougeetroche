# Mettre le nouveau site en ligne

Rien n'est en ligne aujourd'hui. Ce document liste ce qu'il faut pour remplacer le site actuel
(www.rougeetroche-marseille.fr, fourni par Zenchef) par le nouveau, dans l'ordre.

## Le dossier à déposer
Il se prépare en deux commandes, depuis le dossier `v2` :

    python3 outils/build.py
    python3 outils/dossier-en-ligne.py

Résultat : le dossier `v2/en-ligne/` (environ 50 Mo, 167 fichiers). C'est **lui seul** qu'on dépose chez l'hébergeur.
Il ne contient ni les pages de test, ni les outils, ni l'administration.

## Version de test sur GitHub Pages
    python3 outils/build.py
    python3 outils/dossier-en-ligne.py --github

Résultat : `v2/en-ligne-github/`, le même site, mais **invisible pour Google** (balise « noindex » sur chaque page,
robots.txt fermé, pas de plan du site). On dépose le **contenu** de ce dossier à la racine d'un dépôt GitHub,
puis Settings → Pages → « Deploy from a branch », branche `main`, dossier `/ (root)`.

Attention : le bouton « Réserver » y prend de **vraies réservations** Zenchef. Pour tester, s'arrêter avant
la confirmation ; une réservation de test passée par erreur s'annule dans Zenchef.
Ne jamais déposer ce dossier sur le vrai domaine : il empêcherait Google de référencer le site.

## 1. Les décisions à prendre (par vous)
- [ ] **Qui détient le nom de domaine** `rougeetroche-marseille.fr` ? Le restaurant ou Zenchef ? Il faut un accès à sa configuration (DNS) pour faire pointer le nom vers le nouvel hébergeur.
- [ ] **L'hébergeur.** Le site est fait de pages fixes : n'importe quel hébergement « site statique » convient, avec un certificat HTTPS et la possibilité d'utiliser votre nom de domaine. Le dépôt peut se faire par simple glisser-déposer du dossier `en-ligne`.
- [ ] **Zenchef.** Garder l'abonnement de réservation (le widget fonctionne avec l'identifiant 367179), mais vérifier avec Zenchef :
  - que leur widget accepte d'être utilisé sur un site qu'ils n'hébergent pas ;
  - ce que devient leur module « site internet » une fois remplacé, et s'il est facturé à part.

## 2. Avant de basculer
- [ ] Déposer le dossier sur une **adresse provisoire** de l'hébergeur et tout vérifier sur téléphone : réservation Zenchef, formulaire de groupe, plan, galerie.
- [ ] **Formulaire de groupe.** Aujourd'hui, il ouvre la messagerie du visiteur avec la demande prête (adresse : fiducial@rougeetroche.fr). Un visiteur sans messagerie configurée ne peut pas l'envoyer. Pour un envoi direct, il faut un service de formulaire ; son adresse se met dans `data/site.json`, champ `formulaireEndpoint`.
- [ ] **Mentions légales** : compléter la ville du RCS, le directeur de la publication et l'hébergeur (encarts jaunes).

## 3. Le jour de la bascule
- [ ] Faire pointer le nom de domaine vers le nouvel hébergeur.
- [ ] **Rediriger les anciennes adresses** vers les nouvelles, pour garder le référencement Google :

| Ancienne adresse | Nouvelle adresse |
|---|---|
| `/menus-carte/` | `/carte.html` |
| `/photos/` | `/galerie.html` |
| `/informations-contact/` | `/acces.html` |
| `/mentions-legales/` | `/mentions-legales.html` |
| `/en/` | `/en/` |
| `/es/`, `/it/`, `/de/`, `/pt/`, `/ru/`, `/cs/`, `/ja/`, `/zh/`, `/nl/`, `/el/` | `/en/` (le nouveau site n'a que le français et l'anglais) |

## 4. Juste après
- [ ] **Google Search Console** : déclarer le site et envoyer le plan du site (`/sitemap.xml`).
- [ ] **Fiche Google** du restaurant : vérifier le lien vers le site, les horaires (tous les jours, 8 h – 22 h) et le lien vers la carte.
- [ ] **Instagram et Facebook** : mettre à jour le lien du profil.

## Mettre à jour le site une fois en ligne
L'administration (`v2/admin/`) modifie les fichiers **de cet ordinateur**. Pour que le site en ligne suive,
il faut ensuite redéposer les fichiers modifiés du dossier `data` (ou tout le dossier `en-ligne`, après les deux commandes ci-dessus).
Si l'équipe doit changer le plat du jour depuis le restaurant, sans ordinateur, il faudra une autre solution : à décider avec l'hébergeur choisi.
