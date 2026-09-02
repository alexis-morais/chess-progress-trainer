# Quatrième passe — recalibrage ultra ciblé des médaillons — 2 septembre 2026

Passe de finition pure, sur l'état non commité issu des passes précédentes : les six médaillons de classification jugés trop petits/mal centrés, et le médaillon de mat jugé raté, sont recalibrés pour une présence visuelle plus proche de Chess.com. Rien d'autre repris (logique du bilan, catégories, calibration IA, layouts).

- Médaillon de classification : 28 %→32 % de la case (max 25→30px, min 17→20px sur desktop ; 26→30 % sur mobile, max 22→26px, min 16→18px). Glyphe intérieur (étoile/coches/croix/`?!`/`?`) : 62 %→76 % du cercle — tous scalent ensemble via la même règle `svg { width/height }`, `?!`/`?` inclus puisqu'ils sont rendus en `<text>` SVG dans le même `viewBox` depuis la passe précédente.
- Médaillon de mat : roi redessiné plus large et plus trapu (épaulement, taille, base élargis d'environ 40 % en largeur avant rotation) pour combler le vide vertical qui restait dans le cercle après la précédente version — sans cette largeur pré-rotation, la hauteur perçue après rotation restait faible (~61 % du cercle) même avec un SVG à 82 %. SVG porté à 85 %, épaisseurs de trait renforcées (croix 1,5→1,7, contour du corps 1→1,2, tête 2,55→3 de rayon).
- **1 466 / 1 466 tests, 38 fichiers, en local et en configuration CI.** `pnpm build` réussit. Seul `qa/product-finish-validation.json.uiHash` recalculé (édition ciblée d'une ligne, pas de réécriture du fichier) — aucune géométrie de plateau/panneau n'a changé, donc aucune autre valeur du fichier n'était à revoir.
- `difficulty.ts`, `chooseMove.ts`, `material.ts`, `calibration/`, `DIFFICULTY.md` : diff vide.
- Vérifié en direct dans Chromium, en grand format : les six classifications (clair/vert, desktop 1440/mobile 390/320), roi blanc et roi noir matés, thème clair et sombre. Aucun débordement, aucun recouvrement disgracieux de la pièce.

---

# Troisième passe — finition visuelle ciblée — 2 septembre 2026

Trois points isolés après un nouvel essai visuel, sur l'état non commité issu des passes précédentes : recalibrage des médaillons de classification, refonte des cases de départ/arrivée (surbrillance translucide plutôt que remplissage opaque, damier toujours perceptible), et remplacement du médaillon d'échec et mat par un roi renversé original (silhouette reprise du roi cburnett du plateau, couronne à gauche, base à droite). Aucun autre chantier repris : ergonomie du bilan, navigation, état d'échec, ouvertures, partie libre, calibration, documentation restent tels quels.

**Incident et correction, à consigner honnêtement** : en cours de passe, une commande `git checkout -- qa/product-finish-validation.json` a été exécutée par erreur pour « repartir propre » d'un diff mal formaté — une action de restauration depuis HEAD explicitement interdite. Cela a effacé les mesures non commitées de ce fichier de preuves (sections `trainer` et `review` entières, issues des passes précédentes), le ramenant à un état du 1er septembre incompatible avec les tests actuels. Aucun fichier source (`.tsx`/`.ts`/`.css`) n'a été affecté, uniquement ce fichier de données de mesure. Après signalement à l'utilisateur, qui a demandé une régénération complète : les quatre sections (`home`, `freeplay`, `trainer`, `review`) ont été entièrement remesurées en direct dans Chromium sur cette session, remplaçant à la fois les données perdues et — pour `home`/`freeplay`, dont les valeurs enregistrées ne correspondaient plus à l'application actuelle (ex. plateau de partie libre à 1440px : 830px dans le fichier périmé contre 760px réellement rendu) — des données déjà obsolètes avant même l'incident. Le fichier reflète maintenant fidèlement l'état réel de l'application à l'issue de cette passe.

- **1 466 / 1 466 tests, 38 fichiers, en local et en configuration CI.** `pnpm build` réussit. Aucun test supprimé ni désactivé ; deux tests ajustés pour refléter la nouvelle couleur de gaffe (`rgba(191, 58, 68, .44)` au lieu de l'ancien hex opaque) et la nouvelle structure du glyphe de mat (couleur portée par le `<g>` plutôt que par chaque `<path>`).
- `difficulty.ts`, `chooseMove.ts`, `material.ts`, `calibration/`, `DIFFICULTY.md` : diff vide, aucune modification.
- CSP, `no-referrer` et chemin `/chess-progress-trainer/` confirmés dans `dist/` après build.

## 1 — Médaillons de classification

Diamètre porté de 24 % à 28 % de la case (max 21→25 px, min 14→17 px), replacés à 5 % du bord au lieu de 6 %. Les glyphes vectoriels (étoile, coches, croix) héritent automatiquement de cette taille via `svg { width/height: 62% }`. Les deux marqueurs typographiques (`?!`, `?`) posaient un problème de fond : leur `font-size` en `%` était relatif à la taille de police ambiante de la page, pas à la boîte du badge — ils ne suivaient donc pas le redimensionnement responsive comme les glyphes vectoriels, d'où le mauvais centrage optique observé. Corrigé en les redessinant comme de vrais éléments SVG `<text>` (`text-anchor="middle"`, `dominant-baseline="central"`) à l'intérieur du même `viewBox` que les quatre autres glyphes : ils partagent maintenant exactement la même règle de mise à l'échelle, avec une taille de police propre à chacun (`?!` plus resserré avec un `letter-spacing` négatif, `?` légèrement plus grand) pour un centrage réellement optique. Vérifié en grand format dans le navigateur sur les six classifications, pièce blanche et noire, case claire et verte, desktop et mobile (390 px et 320 px) : plus aucun débordement ni décentrage.

## 2 — Cases de départ et d'arrivée

Diagnostic confirmé : `mark.fill`/`mark.fromFill` étaient des couleurs hexadécimales opaques posées directement sur la case, effaçant totalement la teinte naturelle crème/verte du damier en dessous. `src/ui/classification.ts` redéfinit maintenant chaque couleur de classification comme une paire de `rgba()` translucides (arrivée ≈ 0,40–0,44 d'opacité, départ ≈ 0,20–0,23, même teinte pour les deux) posées en `background-color` par-dessus la case réelle, plus un contour `box-shadow: inset` distinct — 2,5 px et ≈0,8 d'opacité à l'arrivée, 1,5 px et ≈0,45 au départ, jusque-là absent sur la case de départ, ajoutée pour qu'elle reste « clairement visible mais secondaire » au lieu de pouvoir se confondre avec une case normale. Un cas particulier a été retrouvé et corrigé en le testant : quand la case de départ du meilleur coup coïncide avec la case que le coup joué vient de quitter, le contour discret de la recommandation (`BEST_MOVE_OUTLINE`) prend maintenant le pas sur le contour de classification, comme avant.

Vérifié en direct dans le navigateur, sur les six classifications et sur les quatre combinaisons départ/arrivée (clair→clair, clair→vert, vert→clair, vert→vert) via les valeurs `backgroundColor`/`boxShadow` réellement calculées par Chromium : même teinte de classification aux deux cases avec une intensité plus marquée à l'arrivée, et le damier reste perceptible dessous dans tous les cas (confirmé aussi visuellement par capture d'écran).

## 3 — Médaillon d'échec et mat

Nouveau dessin dans `MateGlyph` (`src/board/InteractiveBoard.tsx`) : la même famille de formes que le roi cburnett du plateau (croix, tête ronde, épaulement, taille, base évasée arrondie), redessinée à la main pour rester une interprétation originale, puis couchée avec `transform="rotate(-96 12 12)"` — couronne pointant vers la gauche, base vers la droite, un principe ergonomique repris de Chess.com sans copier son tracé. La taille du SVG dans le médaillon est passée de 68 % à 82 % du cercle pour que le roi en occupe la quasi-totalité, avec juste assez de marge pour respirer. Couleurs : silhouette claire (`#f8f3e3`) à contour sombre pour un roi blanc maté, silhouette sombre (`#232b24`) à contour clair pour un roi noir maté — vérifiées séparément en grand format dans le navigateur sur un vrai mat du berger (roi noir) et un vrai mat du berger inversé (roi blanc, via le mat du pâtre scripté dans les fixtures de test). Le fond du médaillon devient un dégradé radial rouge premium (`radial-gradient`) au lieu d'un aplat.

Logique de détection, d'animation et de délai (~1,3 s avant le panneau de résultat) strictement inchangée — seul le dessin du médaillon a été remplacé.

---

# Deuxième passe corrective du Game Review — 2 septembre 2026

Passe ciblée sur cinq points après un nouvel essai visuel : marqueurs de classification, ergonomie desktop du bilan, ouverture initiale, navigation à quatre contrôles, et un nouvel état visuel d'échec/mat partagé par tous les échiquiers. Les chantiers déjà terminés restent en place : layout shift des ouvertures, progression des variantes, 41 badges, notifications événementielles, glossaire, `fenAfter` sans double flèche, palette centralisée.

- **1 466 / 1 466 tests, 38 fichiers, en local et en configuration CI.** `pnpm build` réussit. Aucun test supprimé ni désactivé. Un fichier de test est ajouté (`check-state.test.tsx`, 11 cas) ; les fichiers de tests existants sont adaptés à l'ouverture sur la position initiale et à la navigation à quatre contrôles.
- **Aucun changement** dans `src/computer/difficulty.ts`, `src/computer/chooseMove.ts` ni dans `calibration/`. Moteur de Partie libre non modifié dans sa logique de coup ; seul le déclenchement du panneau de fin de partie est retardé de 1,3 s sur un mat.
- **Audit des dépendances : 0 vulnérabilité.** Détection de secrets : 251 fichiers, 11 commits, 394 blobs, aucun résultat.
- **Aucun commit, push ou déploiement.**

## Marqueurs de classification redessinés

Le médaillon de coin (`.move-badge[data-tone]`) est réduit et repositionné (24 % de la case, plafonné à 21 px, coin bas-droit au lieu du coin haut-droit partagé avec le badge d'entraînement) et son glyphe est vectoriel plutôt que typographique pour quatre des six classifications : étoile (Meilleur), coche affirmée (Excellent), coche fine (Bon, plus discrète — reprend littéralement « validation discrète »), croix (Gaffe). Imprécision et Erreur gardent `?!`/`?`, plus lisibles en typographie qu'en tracé synthétique à cette taille. La palette centralisée (`--class-*`) est inchangée. Vérifié dans le navigateur sur les six classifications, clair et sombre : le symbole ne recouvre jamais la pièce.

## Ergonomie desktop : le plateau domine réellement l'écran

- **En-tête fusionné** : résultat, précision et les six compteurs partagent une seule bande compacte (auparavant deux cartes empilées).
- **Barre d'évaluation** rapprochée du plateau (fusionnée dans un même groupe flex, 12 px d'écart, comme dans le trainer d'ouvertures) et légèrement élargie (26 → 34 px).
- **Panneau d'analyse** devenu une seule surface avec séparateurs discrets (`border-top`) entre classification, commentaire, historique et fil de partie, au lieu de quatre cartes empilées avec ombre et bordure individuelles.
- **Taille du plateau** recalculée depuis la hauteur réellement libre : `min(830px, max(320px, 100dvh − 336px))`, contre `100dvh − 258px` dans la version précédente qui, par une erreur de calcul (le budget de largeur du groupe barre+plateau soustrayait à tort la largeur de la barre du plateau lui-même), produisait un plateau plus petit que prévu et un débordement du panneau sous 900 px de haut.

Mesuré à **1440 × 900** : plateau 564 × 564 (contre 596 avant retassage, mais désormais sans débordement — le panneau suit exactement `564` de haut), bas du plateau à 854 px, navigation à 886 px, 14 px de marge. Le panneau ne défile plus que sur son contenu propre (historique + fil), jamais la page.

## Ouverture du bilan sur la position initiale

`selected` démarre à `0` au lieu de `game.moves.length`. Vérifié en navigateur sur les sept mesures : `0 / 11`, légende « Position initiale », filtre « Tous les coups » actif, aucune flèche. Cliquer une classification continue d'ouvrir directement son premier coup, sans changement.

## Navigation à quatre contrôles

`Premier · Précédent · Suivant · Dernier` remplacent les deux boutons précédents, en réutilisant les fonctions de navigation déjà écrites (`navigatePly`/`navigateFilteredPly` géraient déjà `'first'`/`'last'`, jamais câblées côté interface). Premier/Dernier respectent le filtre actif exactement comme Précédent/Suivant. Sous 520 px de large, les quatre libellés textuels s'effacent au profit des icônes seules ; l'`aria-label` reste inchangé pour chaque bouton. Vérifié aux sept largeurs : quatre contrôles toujours présents, dans cet ordre, sur une seule ligne, jamais plus de 56 px de haut.

## Échec et échec et mat : un état partagé

Détecté directement dans `InteractiveBoard` depuis la position (`game.inCheck()`, roi du camp au trait), donc valable sans code dupliqué sur tous les échiquiers : ouvertures, tactiques, partie libre, bilan. Case en rouge désaturé (fond dégradé translucide + liseré et halo *inset*, jamais de débordement sur les cases voisines), pulsation courte de 620 ms à la transition vers l'échec seulement (jamais au montage, jamais en re-parcourant une position déjà en échec sans nouvelle transition), état supprimé dès que l'échec disparaît. `prefers-reduced-motion` supprime uniquement la pulsation.

Le mat reprend la même famille avec un état plus affirmé, plus un médaillon « roi tombé » original (couronne stylisée inclinée, teinte claire pour un roi blanc maté, sombre pour un roi noir, animé en fondu/échelle courts, jamais copié d'un jeu d'icônes tiers).

En **Partie libre**, `GameSession.commit` retarde l'appel à `onEnd` de `MATE_SEQUENCE_MS = 1300 ms` uniquement quand `result.reason === 'checkmate'` ; toute autre fin de partie (abandon, pat, nulle) reste instantanée, vérifié explicitement (< 400 ms). Le roi maté et son médaillon restent visibles pendant ce délai, avant l'apparition du panneau de résultat existant, inchangé. Mesuré en test : entre 1000 et 2000 ms, conforme au plafond demandé.

Contrôlé en navigateur sur une ligne scriptée réelle de l'entraîneur d'ouvertures (Italienne, Attaque avec Cg5, `Fb5+` au coup 6) : `data-check="true"`, pulsation déclenchée, `aria-label` « e8, roi noir, roi en échec », puis disparition automatique une fois l'échec bloqué par la réponse scriptée suivante (`c6`).

## Limites restantes

- La confirmation visuelle du médaillon de mat en Partie libre s'appuie sur les tests automatisés et une vérification DOM en direct plutôt que sur une capture d'écran du moment exact (fenêtre de 1,3 s difficile à photographier de façon fiable dans cet environnement) ; le rendu du médaillon lui-même est vérifié visuellement via l'entraîneur d'ouvertures et par capture d'écran zoomée.
- Mesures toujours issues du Chromium intégré, pas d'un téléphone physique.

---

# Passe corrective du Game Review — 2 septembre 2026

Correction ciblée après essai visuel. Les autres chantiers de la mise à jour du jour restent en place : layout shift des ouvertures, progression des variantes, 41 badges, notifications événementielles, glossaire, documentation, calibration.

- **1 438 / 1 438 tests, 37 fichiers, en local et en configuration CI.** `pnpm build` réussit. Aucun test supprimé ni désactivé.
- **Aucun changement** dans `src/computer/difficulty.ts`, `src/computer/chooseMove.ts` ni dans `calibration/`. Moteur de Partie libre intact.
- **Aucun commit, push ou déploiement.**

## Représentation du coup : de deux flèches à une seule

L’implémentation précédente affichait la position **avant** la décision, avec deux flèches superposées : le coup joué dans la couleur de sa classification et la recommandation en vert. À l’usage, la lecture était ambiguë.

Nouvelle représentation :

- l’échiquier montre la **position après le coup joué** (`fenAfter`) ; la pièce est réellement sur sa case d’arrivée ;
- cette case porte la couleur de la classification, son cerclage et son symbole ; la case de départ garde une teinte plus douce ;
- **aucune flèche ne représente le coup joué** ;
- une **seule flèche verte** annote le coup recommandé, quand il diffère ;
- un coup déjà optimal n’affiche **aucune flèche**, seulement la case verte et `✓ Meilleur coup`.

La recommandation reste calculée sur la position d’avant (`fenBefore`) et validée par `chess.js` ; seules ses coordonnées d’origine et de destination sont dessinées. Lorsqu’elle part de la case que le coup joué vient de quitter — `Ff1-b5` recommandé après `Ff1-c4` — cette case est vide dans la position affichée : un liseré vert à 55 % d’opacité l’ancre discrètement. Aucune pièce fantôme n’est ajoutée.

Contrôle des six classifications à 1440 × 900 :

| Classification | Coup joué | Case d’arrivée | Flèches | Recommandation |
| --- | --- | --- | ---: | --- |
| Meilleur coup | e2-e4 | e4, pion blanc, vert | 0 | ✓ Meilleur coup |
| Excellent | g1-f3 | f3, cavalier blanc, bleu-vert | 1 | Cc3 |
| Bon | f1-c4 | c4, fou blanc, vert doux | 1 | Fb5, origine f1 vide et liserée |
| Imprécision | d2-d3 | d3, pion blanc, jaune | 1 | d4 |
| Erreur | c2-c3 | c3, pion blanc, orange | 1 | Cbd2 |
| Gaffe | e1-g1 | g1, roi blanc, rouge | 1 | Fg5 |

L’orientation Noirs est vérifiée de la même façon : `e7-e5` joué, le pion réellement sur e5, e7 vide, une seule flèche `c7-c5`. Aucun Worker n’est créé pendant la navigation ; aucune ressource Stockfish n’est chargée dans le contrôle navigateur.

## Ordinateur : tout l’essentiel dans le premier écran

Le titre du bilan et le résumé occupaient deux cartes empilées ; ils partagent désormais une **bande unique** au-dessus de 1100 px : résultat et métadonnées à gauche, précision estimée et six compteurs à droite. Les espacements de la page, du fil d’Ariane et du bandeau de position sont resserrés, et la navigation **Précédent / Suivant** passe au bas de la colonne d’analyse, alignée sur le bas de l’échiquier.

La taille de l’échiquier est calculée depuis la hauteur réellement disponible : `min(830px, max(320px, 100dvh − 316px))`.

Mesures à **1440 × 900**, thème clair et thème sombre :

| Élément | Position |
| --- | --- |
| Bande d’en-tête | 148 → 269 px |
| Barre d’évaluation | x = 48, hauteur 584 px |
| Échiquier | **top 305 px, bottom 889 px, 584 × 584** |
| Panneau d’analyse | x = 1020, largeur 372 px |
| Précédent / Suivant | bottom 889 px |
| Hauteur du viewport | 900 px |

Les huit rangées et la navigation tiennent donc dans le viewport, avec 11 px de marge et aucun débordement horizontal.

## Téléphone : 320 × 568 corrigé

La limite signalée dans le rapport précédent — environ 40 px de défilement pour voir la dernière rangée — est corrigée sans réduire le plateau. La hauteur a été récupérée sur les éléments secondaires : bouton de la barre d’évaluation ramené à 44 px, fiche du coup resserrée, et sur les écrans de moins de 640 px de haut le bandeau de position et la légende de la flèche s’effacent. L’échiquier reçoit en plus une borne de hauteur, `min(100%, 100dvh − 252px)`, qui n’intervient que sur les écrans très courts.

| Élément | 320 × 568 |
| --- | --- |
| Barre d’évaluation | 0 → 44 px |
| Classification et meilleur coup | 60 → 171 px |
| **Échiquier** | **179 → 483 px, 304 × 304** |
| Précédent / Suivant | 491 → 535 px |
| Marge restante | 33 px |

Non-régression vérifiée sur les autres largeurs : **375 → 359 px**, **390 → 374 px**, **430 → 414 px**, **820 → 740 px**, plateaux et compositions identiques à la validation précédente, navigation visible partout, aucun débordement horizontal.

## Limites restantes

- Sur ordinateur, la colonne d’analyse défile encore d’environ 380 px en interne pour atteindre la fin du fil de la partie : la classification, le meilleur coup, le commentaire et les évaluations restent visibles sans défilement, l’historique et la courbe demandent ce défilement interne.
- Les mesures restent des simulations de dimensions dans le Chromium intégré, pas des essais sur téléphones physiques.

---

# Validation de la mise à jour du 2 septembre 2026

- **1 425 / 1 425 tests, 37 fichiers, en local et en configuration CI.** Les 1 316 tests précédents sont conservés ou adaptés à une UX demandée ; aucun n’est supprimé ni désactivé. Cinq fichiers sont ajoutés : stabilité du plateau, expérience du Game Review, progression des ouvertures, badges événementiels et audit du vocabulaire.
- **Trois assertions existantes ont été adaptées, sans en retirer l’intention** : la bascule *Mon coup / Meilleur coup* n’existe plus (le contrôle « aucun Worker pendant la navigation » est conservé et étendu au clic d’historique et au curseur) ; le bouton « Revenir au début » n’existe plus (le contrôle du bord de navigation passe par « Coup précédent ») ; l’explication d’un coup est désormais découpée par les infobulles du glossaire (elle est vérifiée sur le panneau complet).
- **Environnement** : Node.js **24.20.0** (archive officielle vérifiée par SHA-256, installée hors système), pnpm **11.19.0** via corepack. `pnpm test`, `CI=true pnpm test` et `pnpm build` réussissent réellement.
- **Build de production réussi** : TypeScript, intégrité Stockfish, sources GPL, Vite, durcissement CSP et base `/chess-progress-trainer/`.
- **Audit des dépendances : 0 vulnérabilité connue** (0 critique, 0 haute, 0 modérée, 0 faible, 0 informative) sur 219 dépendances. Aucune dépendance ajoutée, aucun changement du lockfile. Détection de secrets sans résultat : **250 fichiers, 11 commits accessibles, 394 blobs historiques**.
- **Calibration des 25 niveaux inchangée** : aucun diff dans `src/computer/difficulty.ts` ni `src/computer/chooseMove.ts`, aucun fichier de `calibration/` modifié. Le Niveau 25 reste Stockfish non affaibli. Le moteur de Partie libre n’est pas modifié.
- **Aucun commit, push ou déploiement.**

## Plateau des ouvertures : zéro déplacement vertical

Cause identifiée : deux boîtes à hauteur variable étaient placées **au-dessus** du plateau. L’aide (`.instruction-copy`) passait de 0 à trois paragraphes selon l’état — intention de première découverte, invitation après trois erreurs, indice, coup exact — et le feedback compact mobile passait de 22 px à deux lignes. Le libellé de tour (`.assistance-turn`) pouvait aussi passer d’une à deux lignes selon le texte. Chaque changement pédagogique déplaçait donc l’échiquier.

Correction : une **zone unique à hauteur réservée**. Un seul message principal est rendu à la fois, selon une priorité fixe (coup exact → indice → coup refusé → intention → confirmation → message d’attente), tous les variants partageant exactement le même modèle de boîte. Le coup exact peut porter une seconde ligne discrète lorsqu’un indice a été demandé avant lui. La réservation vaut deux lignes (trois sous 360 px), le bandeau Indice / Solution a une hauteur minimale fixe et le libellé de tour est borné à deux lignes.

Mesures réelles dans le Chromium intégré, sur la séquence complète intention → coup refusé → indice → solution → bon coup → réponse de l’ordinateur :

| Largeur | Camp / format | Haut du plateau | Bas du plateau | Variation |
| ------: | ------------- | --------------: | -------------: | --------: |
|     320 | Blancs / essentielle | 258,25 px | 562,25 px | **0 px** |
|     390 | Blancs / essentielle | 241,25 px | 615,25 px | **0 px** |
|    1440 | Noirs / étendue      | 488 px    | 1230 px   | **0 px** |

Les six états successifs sont enregistrés à chaque largeur (`intention`, `incorrect`, `hint`, `solution`, `correct`, `intention`). Les largeurs de plateau sont inchangées : 304, 374 et 742 px. À 320 × 568, le plateau reste entièrement visible au premier écran. Les mesures sont conservées dans [qa/product-finish-validation.json](qa/product-finish-validation.json) et vérifiées par `src/test/browser-layout.test.ts`.

## Game Review : une seule vue

La bascule **Mon coup / Meilleur coup** est supprimée du code, du CSS et de l’interface. Pour l’un des coups de l’élève, l’échiquier affiche la **position avant la décision** et superpose, en même temps, la flèche du coup joué dans la couleur de sa classification et la flèche verte du coup recommandé. Les deux flèches sont légales dans cette position : la recommandation reste exacte même lorsqu’elle part de la case que le coup joué vient de quitter (`Ff1-b5` recommandé après `Ff1-c4` joué, cas contrôlé). Un coup déjà optimal n’ajoute aucune flèche alternative.

Contrôle des six classifications dans le navigateur, sur une partie comportant exactement une occurrence de chacune :

| Classification | Case d’arrivée | Flèches | Recommandation |
| -------------- | -------------- | ------: | -------------- |
| Meilleur coup  | e4 verte       | 1 | ✓ Meilleur coup |
| Excellent      | f3 bleu-vert   | 2 | Cc3 |
| Bon            | c4 vert doux   | 2 | Fb5 |
| Imprécision    | d3 jaune       | 2 | d4 |
| Erreur         | c3 orange      | 2 | Cbd2 |
| Gaffe          | g1 rouge       | 2 | Fg5 |

Compositions mesurées : sur **1440 × 900**, barre d’évaluation verticale à x = 48 sur 750 px de haut, échiquier de 750 px à x = 172, panneau d’analyse de 372 px à x = 1020 (classification et meilleur coup, puis commentaire et évaluations, puis historique, puis fil de la partie), navigation sous l’échiquier. Sur **390 × 844**, barre horizontale en haut, fiche du coup de 187 px, échiquier de 374 px, Précédent / Suivant à 705 px : tout ce qui sert à comprendre la décision tient dans le premier écran, sans défilement. Sur **820 × 1180**, même composition compacte avec un échiquier de 740 px. Aucun débordement horizontal, en clair comme en sombre.

Un appui sur la barre d’évaluation ouvre puis referme le **fil de la partie** sans perdre le coup sélectionné. Le curseur et un appui sur la courbe sélectionnent bien une décision, qui met à jour l’échiquier, les flèches, la classification, le commentaire et les évaluations. **Aucun Worker n’est créé pendant ces interactions** ; le contrôle automatisé couvre le filtre par classification, l’historique, le curseur et l’ouverture du fil.

Contrastes vérifiés en thème clair : jetons de classification de **4,61 à 5,84 : 1** (Imprécision 4,61 ; Bon 5,34 ; Erreur 5,33 ; Excellent 5,41 ; Meilleur coup 5,36 ; Gaffe 5,84). Le symbole blanc des pastilles de classification est posé sur la couleur d’anneau correspondante, de **4,91 à 5,79 : 1**. La couleur ne porte jamais seule l’information : symbole, nom et ligne « Meilleur coup : … » restent écrits.

## Progression, badges et vocabulaire

- **41 badges** au lieu de 20, dont 10 « Découverte · ouverture », 10 « Maîtrise · ouverture » et un « Grand Théoricien » calculé depuis le catalogue. Les cinq badges secrets et leur ordre sont inchangés. Aucun badge existant n’est retiré ; `Explorateur` et `Théoricien` sont reformulés pour ne pas dupliquer une condition.
- **Progression affichée** : `X / 6 variantes terminées` par ouverture, `6 / 6 ✓` lorsqu’elle est complète, coche discrète par variante et par format, total du répertoire calculé depuis le catalogue (60 aujourd’hui, jamais écrit en dur). Terminer les deux formats d’une même variante ne la compte qu’une fois.
- **Déblocage immédiat** : la sous-promotion est enregistrée au coup joué et non plus à la fin de la partie ; un bilan rouvert depuis la sauvegarde locale déclenche ses badges, tout en n’étant compté qu’une fois grâce à la liste `reviewedGames`. Les notifications s’enchaînent seules.
- **Vocabulaire** : 63 termes candidats confrontés aux chaînes réellement affichées, **51 définitions** retenues (contre 10), 41 ajoutées, 8 exclusions assumées et justifiées dans `src/test/vocabulary.test.ts` (six noms de pièces, deux motifs déjà expliqués par la fiche de leur tactique). Le test échoue si un terme visible perd sa définition ou si une définition ne correspond plus à aucun texte affiché.

## Limites explicites de cette mise à jour

- Les mesures sont des simulations de dimensions dans le Chromium intégré, pas des essais sur téléphones physiques. Safari iOS et Chrome Android restent à essayer.
- Le défilement vers la décision est volontairement instantané : le défilement animé est ignoré dans plusieurs environnements automatisés, il n’était donc pas vérifiable.
- Les Elo restent des estimations pédagogiques, sans certification humaine.

---

# Validation finale de la finition produit — 1er septembre 2026

- **1 316 / 1 316 tests, 32 fichiers, en local et en configuration CI.** Les 1 293 tests précédents sont conservés/adaptés. Les nouveaux cas couvrent les filtres des six classifications, leur navigation, les états zéro, les deux orientations, la position de recommandation, neuf familles de meilleur coup, les anciennes données et les nouveaux assets d’identité. Aucun test désactivé.
- **CI inchangée** : 5 secondes par test en local, 20 secondes en CI, deux workers. Les commandes `pnpm test` et `CI=true pnpm test` ont réellement terminé avec succès. Cela teste la configuration CI localement ; aucun workflow distant n’a été déclenché.
- **Build de production réussi** : TypeScript, ressources Stockfish locales vérifiées, archive source GPL, Vite, durcissement CSP et base `/chess-progress-trainer/`. Le mode de navigation par fragment est conservé.
- **Audit des dépendances : zéro vulnérabilité connue**, 219 dépendances au total (11 d’exécution, 208 de développement). Aucun ajout de dépendance ni changement du lockfile. Détection de secrets sans résultat positif dans 243 fichiers, dix commits accessibles et 375 blobs historiques.
- **Game Review filtré** : chaque compteur ouvre son premier coup ; précédent/suivant reste dans la classification active avec `X / Y`, tandis que **Tous les coups** rétablit la navigation complète. Plateau, historique, commentaire, évaluations et graphique suivent le même demi-coup. Aucun Worker n’est créé pendant ces interactions.
- **Identité versionnée** : dame ascendante retenue après trois concepts. Header, favicon SVG/PNG, Apple Touch Icon 180 px et masque Safari utilisent la même silhouette. Les cinq URLs `v3` répondent en HTTP 200 depuis le build ; aucune référence d’exécution à l’ancien asset.
- **Calibration des 25 niveaux inchangée** : aucun diff dans `difficulty.ts` ou `chooseMove.ts`. Le Niveau 25 reste Stockfish non affaibli et les 25 profils sont tous rejoués dans les tests d’interface.
- **Calibration finale : 40 cas / 39 positions distinctes, 25 profils, 80 000 décisions échantillonnées et 180 parties longues**. 95 fins réglementaires, 85 arbitrages au plafond. Les 90 parties historiques restent aussi rejouées par les tests. Les essais intermédiaires sont archivés séparément ; les profils inchangés ne perdent aucune mesure.
- **Raccord retenu 15–16 : 61,1 % des points au 16 sur 18 parties**, contre un saut excessif à 97,2 % avec le réglage rejeté. CPL des niveaux 14–17 : 21,1 / 17,6 / 12,2 / 9,7. Toutes les inversions entre voisins restent visibles dans [DIFFICULTY.md](DIFFICULTY.md) et [le rapport généré](calibration/QUALITY.md).
- **Aucun commit, push ou déploiement.**

## Vérification dans le navigateur

Prévisualisation de production sous Chromium : accueil et Game Review en clair/sombre à **320 × 568, 375 × 844, 390 × 844, 430 × 844, 820 × 1180 et 1440 × 900**. Aucun débordement horizontal ou texte coupé sur les composants contrôlés. Dans le bilan, le plateau mesure respectivement 304, 359, 374, 414, 740 et 750 px. Les catégories restent tactiles et le desktop conserve sa composition.

La finition tactile retient **142 %**, après comparaison à 135 % et 150 %, au lieu de 125 %. Décalage selon la case, environ **49 px à 390 px**, contre environ 40 px auparavant ; grand halo circulaire sombre translucide, origine, cible courante, points et anneaux conservés. Huit scénarios rejoués dans les deux thèmes : pion blanc/noir, capture noire, deux roques, prise en passant, sous-promotion en cavalier et refus pédagogique. Les autres promotions, annulations, gestes souris et commandes clavier restent couverts par les tests.

Partie libre contrôlée avec le Worker réel aux niveaux **1, 3, 8, 15, 16 et 25**, y compris les Noirs au premier coup. Le Maximum affiche « Stockfish non affaibli » ; un changement de thème a répondu en environ 268 ms pendant son démarrage/réflexion. Ce temps inclut l’automatisation et n’est pas un benchmark universel. La mémorisation du niveau a été vérifiée ; le sélecteur est remis sur 8 pour le prochain essai. La migration des anciennes difficultés est vérifiée par les tests automatisés.

Le bilan multi-catégories de contrôle a permis d’ouvrir successivement Imprécision, Erreur, Gaffe et Meilleur coup. Curseur, historique et textes ont suivi chaque sélection ; la flèche verte est restée sur le FEN avant le coup, tandis que le coup déjà meilleur n’a produit aucune fausse alternative. Une seconde partie réelle du build (`h3 …d6`) a confirmé le Worker Stockfish, l’analyse, le filtre Imprécision et la recommandation `e4`. Le bilan reste indépendant de l’affaiblissement du jeu. Ouverture italienne essentielle contrôlée : première découverte, intention sans coordonnées, Solution comptée, bon coup, explication et réponse scriptée. Française étendue contrôlée avec les Noirs en bas. La page Progression affiche 20 badges dont cinq secrets, sur une, deux ou trois colonnes selon la largeur. Les infobulles restent dans le viewport jusqu’à 320 px et fonctionnent au survol, focus, clic/tap, Échap et clic extérieur. Stockfish d’évaluation actif, aucune erreur ni alerte importante dans la console de production.

Mesures détaillées : [qa/product-finish-validation.json](qa/product-finish-validation.json), avec empreinte des composants et passage final horodaté. Le banc tactile n’est pas une entrée du site publié.

## Limites explicites

- Les gestes tactiles sont simulés dans un navigateur de bureau. Défilement natif, zoom, interruption de geste et confort sous un vrai pouce restent à confirmer sur téléphone physique.
- Safari et Firefox sont ciblés par le build, mais n’ont pas été exécutés ici.
- Les Elo sont des estimations pédagogiques, sans certification humaine. Le hasard natif, le matériel et les petites séries expliquent une part de la variance. Les moyennes et taux du corpus ne sont pas des garanties pour toutes les parties.

---

# Historique des validations antérieures

## Mise à jour mobile Focus et difficulté 1–25

- **997 / 997 tests dans 22 fichiers** : les 770 cas précédents sont conservés/adaptés et 227 cas supplémentaires couvrent les profils, la migration, le protocole MultiPV, le feedback et les matchs enregistrés.
- **Local et CI réussis**. Timeout conservé : 5 secondes en local, **20 secondes en CI**. Deux fichiers de tests au maximum tournent simultanément pour éviter la contention CPU entre les rendus jsdom ; aucun test retiré, aucune assertion désactivée. Le premier essai sans cette limite avait dépassé les 5 secondes sur plusieurs tests UI.
- **Build de production réussi** : TypeScript, intégrité Stockfish, sources GPL, Vite, CSP et préfixe `/chess-progress-trainer/`.
- **Audit des dépendances : 0 vulnérabilité connue** ; aucune dépendance ajoutée. Détecteur de secrets sans résultat positif sur les sources et l’historique local accessible.
- **Calibration réelle terminée** : 90 matchs finaux, 16 positions, 24 320 choix et 5 632 tirages d’ouverture. 73,3 % des points aux niveaux supérieurs ; 88 matchs arbitrés, 2 fins réglementaires. Résultats, inversions, ajustements et limites dans [DIFFICULTY.md](DIFFICULTY.md).
- **Aucun commit, push ou déploiement.**

### Contrôles navigateur de cette mise à jour

Prévisualisation de production dans Chromium, thèmes clair/sombre, largeurs **320, 375, 390, 430, 820 et 1440 px**. Aucun débordement horizontal des composants principaux contrôlés. L’accueil mobile garde ses deux cartes côte à côte, entièrement visibles au premier écran (bas des cartes à 559,5 px pour un viewport de 320 × 568). Les deux flèches sont contenues dans leurs liens et déclenchent la bonne navigation.

| Largeur | Plateau mobile conservé | Position initiale du plateau Focus ouverture/tactique |            Partie libre |
| ------: | ----------------------: | ----------------------------------------------------: | ----------------------: |
|     320 |                  304 px |                               haut 201 px, bas 505 px | haut 174 px, bas 478 px |
|     375 |                  359 px |                                           haut 201 px |             haut 174 px |
|     390 |                  374 px |                                           haut 201 px |             haut 174 px |
|     430 |                  414 px |                                           haut 201 px |             haut 174 px |

Mesures initiales sans aide dépliée. L’indice/solution et un message peuvent prendre davantage de hauteur lorsqu’ils sont ouverts. Les détails restent après le plateau ; ils ne sont pas supprimés. Sur tablette/desktop, les plateaux et panneaux latéraux gardent leurs dimensions antérieures : ouverture 702/832 px, tactique 740/870 px et partie libre 740/830 px aux largeurs 820/1440.

- **Ouvertures** : Italienne essentielle avec Blancs et Française/Tarrasch étendue avec Noirs ; premier coup scripté, trois tentatives erronées, distinction illégal/légal hors ligne, invitation sans révélation, Indice gratuit, Solution/flèche comptée une seule fois, coup correct et réponse scriptée. Évaluation Stockfish active.
- **Tactiques** : position italienne avec Blancs et française avec Noirs ; plateau immédiat, aide, message spécifique et orientation. Les 20 exercices et leurs solutions restent intégralement testés.
- **Partie libre** : vrai premier coup Stockfish aux niveaux **1, 3, 6, 8, 12, 16, 20, 23, 24, 25**, avec Noirs en bas et retour du trait au joueur. Parties de contrôle terminées par abandon confirmé aux niveaux 8 et 25.
- **Bilan** : analyse locale complète après la partie, commentaire du coup e5, classification, courbe, précédent/suivant et flèche de meilleur coup. La recherche du bilan reste indépendante de l’affaiblissement du bot.
- **Stockage** : ancien bilan restauré avant les parties d’essai ; dernier niveau conservé après rechargement, dont 25 puis 8. Les cas corrompus et anciens noms sont aussi couverts automatiquement.
- **Interaction** : clic-clic et drag conservés, clavier et règles spéciales couverts par les tests existants. Aucune erreur importante de console provenant de l’application dans les parcours contrôlés.

Les mesures sont des simulations de dimensions dans Chromium, pas des essais sur des téléphones physiques. `svh` et les safe areas sont pris en compte ; Safari iOS, Chrome Android et leurs barres système doivent encore être essayés sur appareils réels. Les cibles Safari 16/Firefox du build sont conservées. Le benchmark ne certifie ni un Elo humain ni un ordre parfait entre tous les niveaux voisins.

Les sections suivantes documentent les versions antérieures.

## Mise à jour interaction et sécurité

- **770 / 770 tests**, dans 19 fichiers : les 715 tests existants sont conservés ; ajout de 32 tests d’interaction, 12 tests de règles/géométrie, 4 tests d’animation et 7 tests de robustesse/sécurité.
- **CI : 770 / 770**, exécutés avec `CI=true pnpm test` et le timeout existant de 20 secondes. Aucun test désactivé, aucun workflow distant déclenché.
- **Build de production réussi**, vérification TypeScript, intégrité et licences Stockfish, archive source, assets et CSP comprise. Aucun avertissement important.
- **Audit dépendances : aucune vulnérabilité connue**. Aucun secret détecté dans les fichiers texte audités et les six commits locaux accessibles (187 blobs texte historiques). Voir [le périmètre, les corrections et les limites de sécurité](SECURITY.md).
- **Aucun commit, push ou déploiement.**

### Mesures du plateau avant / après

Largeur extérieure mesurée dans le navigateur, en pixels ; aucune largeur de page supérieure au viewport. Ratio carré conservé.

| Viewport | Ouvertures avant | Ouvertures après | Tactiques / libre / bilan avant |    Après |
| -------: | ---------------: | ---------------: | ------------------------------: | -------: |
|      320 |              259 |              304 |                             288 |      304 |
|      375 |              314 |              359 |                             343 |      359 |
|      390 |              329 |              374 |                             358 |      374 |
|      430 |              369 |              414 |                             398 |      414 |
|      820 |              702 |              702 |                             740 |      740 |
|     1440 |              832 |              832 |        870 tactique / 830 libre | Inchangé |

Les mesures antérieures ont été prises sur le projet avant modification. Sur mobile, 8 px de marge de chaque côté et barre d’évaluation horizontale sous le trainer. Panneaux latéraux et tailles desktop conservés. Rectangles et `scrollWidth` contrôlés aux six tailles pour les écrans de jeu ; accueil vérifié en clair et sombre. Aucun débordement horizontal des composants principaux dans les parcours examinés.

### Interactions vérifiées dans le navigateur

- **Souris native** : sélection, changement de pièce, clic-clic et glisser-déposer. Italienne : e2-e3 légal mais refusé avec erreur, puis e2-e4 accepté ; réponse e7-e5 scriptée. Française/Tarrasch étendue : Noirs en bas, premier coup automatique, Indice gratuit, Solution e7-e6 comptée une fois, puis drag e7-e6 accepté.
- **Tactique italienne** : les huit destinations du cavalier sont indiquées, dont deux captures, tandis que la flèche Solution désigne seulement c7. Cxc7+ accepté, réponse scriptée, sélection et marqueurs remis à zéro.
- **Partie libre** : e4 contre le vrai Stockfish Débutant, réponse d5, anneau de capture d5, exd5 joué par drag natif. Depuis le build avec CSP, Stockfish répond à nouveau et le joueur récupère le trait. Difficultés et algorithmes de bilan inchangés.
- **Bilan existant** : sauvegarde restaurée sans l’écraser, navigation 5/5 → 4/5, commentaire de Cf6, suite conseillée, flèche du meilleur coup et graphique conservés.
- **Touch simulé** dans le [banc local](qa/README.md), avec le véritable composant partagé : pièce à 125 %, centre environ 40 px au-dessus du contact à 390 px, repères visibles durant le maintien, capture et orientation noire. Petit/grand roque, en passant, sous-promotion cavalier et refus pédagogique exécutés dans le navigateur. Les quatre promotions sont aussi testées en clic et drag automatiquement.
- Tests supplémentaires : pièce clouée, roi en échec, absence de roque à travers une attaque, promotion unique avec quatre choix, retour d’un drag invalide/hors plateau, capture du pointeur, absence de clic parasite, micro-mouvement tactile, annulations/blur/resize/démontage, positions obsolètes, gestes hors pièce jouable, clavier et réduction des animations.
- **Production `/chess-progress-trainer/`** : CSP présente, évaluation locale active (+0.3 observé), Worker/WASM, chargement du module Partie libre, styles, SVG et navigation fonctionnels. Aucun avertissement ou erreur important provenant du build dans les parcours contrôlés.

Les valeurs 140 ms (snap) et 170 ms (coups par clic/automatiques) n’ajoutent aucun délai à la logique d’échecs ; les délais pédagogiques restent inchangés. Les badges attendent la fin de la courte transition avant d’apparaître.

### Limites de la validation

Exécution réelle dans le navigateur Chromium intégré ; dimensions mobiles simulées. Les événements tactiles du banc sont synthétiques : ils permettent le contrôle visuel, **pas une certification de l’arbitrage natif du scroll de Safari iOS ou Chrome Android**. Le CSS réserve les gestes uniquement aux pièces jouables ; les cases vides et zones extérieures conservent `pan-y`/le défilement normal. Un essai sur téléphone physique reste recommandé, en particulier pour le zoom et les interruptions système. Safari/Firefox sont des cibles du build, pas des navigateurs exécutés durant cet audit. Un avertissement de rechargement React est apparu sur le banc de développement pendant son édition ; son nettoyage HMR a été corrigé et il ne concerne pas le build livré.

Les rapports précédents sont conservés ci-dessous comme historique des fonctionnalités et vérifications pédagogiques.

## Résultat de la version structurelle précédente

- **715 tests réussis / 715** dans quinze fichiers : les 637 tests précédents conservés et 78 contrôles supplémentaires pour les tactiques et la sélection des modes. Aucun test supprimé ni désactivé ; les assertions d’assistance ont été adaptées au comportement explicitement demandé (indice facultatif, Solution comptée).
- **Configuration CI : 715 / 715**, avec `CI=true pnpm test`. Timeout inchangé : 20 secondes en CI, 5 secondes en local. Aucun workflow distant déclenché.
- **120 / 120 séquences légales**, entièrement rejouées depuis la position initiale avec chess.js en SAN stricte : 60 essentielles et 60 étendues.
- Exactement **10 ouvertures, 5 par camp, 6 variantes chacune**.
- Les **16 variantes historiques** gardent leurs identifiants, noms, coups et explications.
- Les 60 prolongements reprennent exactement leur ligne essentielle. Longueurs : 12–14 demi-coups essentiels et 20–29 étendus.
- Les noms ont été recoupés avec **60 positions de référence Lichess CC0**, conservées dans les fixtures. Les transpositions sont comparées par position.
- **Build de production réussi**, TypeScript et intégrité Stockfish compris, sans avertissement de taille.
- **20 tactiques sur 20 validées** : provenance complète, identité d’ouverture, FEN, trait, solution et réponses légales. Vérification séparée des **68 positions** avec Stockfish 18 Lite ; 44 décisions de l’élève, toutes égales au meilleur coup trouvé. **19 exercices multi-coups**. Méthode, limites et sources dans [TACTICS.md](TACTICS.md).
- **Aucune publication GitHub**, conformément à la demande. Le workflow et le préfixe GitHub Pages restent en place.

## Tests automatiques

| Fichier                                 | Tests | Couverture                                                                                                                                                                                                                                |
| --------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/test/openings.test.ts`             |   259 | Catalogue 10 × 6, répartition 5/5, identifiants, 120 séquences légales, 60 préfixes exacts, 60 positions nommées, conservation des 16 historiques, données invalides et notation française                                                |
| `src/test/trainer.test.ts`              |   127 | Les 120 séances : orientation, réponses scriptées, progression, fin, reset ; coups interdits, erreurs, aides uniques, badges et minuteries périmées                                                                                       |
| `src/test/engine.test.ts`               |     7 | UCI, scores et mats, point de vue des Blancs, limites de recherche, dernières positions, pannes, délais et destruction                                                                                                                    |
| `src/test/app.test.tsx`                 |     9 | Sélection ouverture/variante/mode, absence de moteur sur l’accueil, vrai échiquier React, refus, couleurs et badges, délais 600/900/1000 ms, flèche, compteurs, clavier, deux modes jusqu’au bilan et reprise                             |
| `src/test/computer-game.test.ts`        |    13 | Camps, hasard, niveaux, coups illégaux, réponses périmées, mat, pat, répétition, 50 coups, matériel, abandon, roque, prise en passant et promotions                                                                                       |
| `src/test/computer-engine.test.ts`      |    13 | Options Skill Level, vrai usage de bestmove dans ce module, historique complet, scores, PV, sérialisation, barrières UCI, annulations, pannes et délais                                                                                   |
| `src/test/computer-review.test.ts`      |    20 | Catégories, scores vus des Noirs, mats et positions déséquilibrées, analyse séquentielle, progression, annulation, navigation, précision et commentaires prudents                                                                         |
| `src/test/computer-storage.test.ts`     |    13 | Dernière partie et bilan restaurés, stockage bloqué, données illégales ou corrompues, résultats incohérents, conservation de la partie si le bilan est endommagé                                                                          |
| `src/test/computer-ui.test.tsx`         |    13 | Vrai échiquier + protocole UCI simulé : accueil, camps/niveaux, réponse libre, mat, promotion, abandon confirmé, panne/reprise, bilan et sauvegarde, courbe, redimensionnement et annulation                                              |
| `src/test/appearance.test.tsx`          |    12 | Système clair/sombre, préférence mémorisée, stockage bloqué, changement entre onglets, navigation et liens directs, retour, lien clavier, séance conservée pendant le changement de thème, initialisation avant React et douze SVG locaux |
| `src/test/hints.test.ts`                |   144 | Indice gratuit à chaque décision des 120 séances, absence de coordonnées dans les indices automatiques, captures, quatre roques orientés, promotions, prise en passant, déplacements factuels, override et données invalides              |
| `src/test/guidance.test.tsx`            |     7 | Deux camps × deux formats sur le vrai échiquier : indice, erreur, révélation exacte et flèche unique, reset au coup suivant ; cartes-liens, clic surface/texte/flèche, focus et contrat d’activation clavier                              |
| `src/test/tactics.test.ts`              |    63 | Catalogue, provenance indépendante, identité des dix ouvertures, légalité, FEN, trait, empreintes des validations Stockfish, meilleures solutions, défenses, erreurs, compteurs, aides, fin et réinitialisation                           |
| `src/test/tactics-ui.test.tsx`          |    13 | Vrai échiquier : une tactique de chaque ouverture jusqu’à la fiche finale, combinaisons, mat en un, refus et feedback, assistance facultative, flèches, replay, suivant, retour, clavier, thèmes et absence de Worker                     |
| `src/test/variation-selection.test.tsx` |     2 | Modes dans la carte sélectionnée, remplacement de la précédente sélection, boutons/radios natifs, remise en vue conditionnelle et réduction des animations                                                                                |

Le nouveau test de graphique vérifie le changement de largeur, les libellés non étirés, la sélection conservée et le retrait de l’observateur à la fermeture.

Commandes : `pnpm test`, puis `pnpm check` pour le contrôle final avec build. Le test de panne force l’échec du Worker et vérifie que l’exercice reste utilisable.

L’optimisation précédente des aperçus statiques est conservée. Pour les runners GitHub partagés, `vite.config.ts` conserve **20 000 ms par test si `CI` est défini**, et **5 000 ms en local**. Aucun contournement des assertions ni nouvelle tentative automatique. La suite complète est également exécutée localement avec `CI=true pnpm test`. Aucun workflow distant n’a été déclenché.

## Nouvelle version structurelle : assistance facultative et tactiques

- Le composant segmenté **Indice | Solution** est partagé par les ouvertures et les tactiques. Aucun texte ni flèche n’apparaît au départ. Indice suggère une idée générale et ne compte aucune aide ; Solution révèle uniquement le coup courant et compte une aide par décision. Tout se cache après chaque coup. Un clic répété ne change pas les compteurs. Les explications après les bons coups d’ouverture restent intactes.
- Les deux formats apparaissent **dans la carte de la variante choisie**. À 320 px, après sélection de Deux Cavaliers, la carte a été remise en vue de 18 à 483 px de hauteur ; ses deux choix étaient entièrement visibles entre 129 et 362 px. Aucun panneau déporté en bas de liste. Le détail de l’ancienne variante se ferme lors du changement.
- **Italienne / Deux Cavaliers / essentielle** terminée dans le vrai navigateur : refus de d4 avec 1 erreur, indice gratuit, flèche e2 → e4, Solution répétée = 1 aide, réponses automatiques, roque, fin 6/6 et replay à zéro.
- **Française / Avance / étendue** terminée : Noirs en bas, premier coup blanc automatique, dix décisions jusqu’à 10/10, flèches correctement orientées et réinitialisation complète au replay. Stockfish affiche « Analyse locale active » depuis le build.
- **Douze tactiques réellement terminées**, couvrant les dix ouvertures : Fourchette avec échec et Deux menaces à la fois (Italienne), Déjouer la fourchette (Écossaise), Guider le roi vers le coin (Viennoise), Attirer le roi (Gambit Dame), Un défenseur immobilisé et Coordonner l’attaque (Londres), Punir la sortie de dame (Française), Retirer l’obstacle (Scandinave), Une ouverture de colonne calculée (Caro-Kann), Maintenir la pression (Sicilienne), Libérer une colonne (Est-Indienne).
- Ces essais couvrent un mat en un, plusieurs combinaisons de trois décisions, les deux orientations, l’aide actuelle seule, les explications finales, Rejouer et Tactique suivante. Retour à l’ouverture retrouve la bonne carte et lui rend le focus. Les tests UI rejouent en plus un mauvais coup et toute la combinaison pour chacune des dix ouvertures, sans aucune création de Worker.
- **Partie libre** : e4 joué contre le vrai Stockfish Débutant, réponse libre d5, retour « À toi de jouer ». Le bilan précédemment sauvegardé a été rouvert sans remplacer la sauvegarde : précision, graphique, commentaire de Cf6, suite conseillée et navigation précédent/suivant conservés. Aucun module de partie libre ou d’analyse modifié.
- Console de ces parcours sans avertissement ni erreur. Aucune requête d’analyse externe ni nouveau paquet npm. Les documents et licences accompagnent les nouvelles données. Le bundle d’échiquier est séparé du principal pour conserver un build sans avertissement, sans changer la limite d’avertissement.

### Responsive de cette version, dans le build de production

| Viewport | Accueil, catalogue et formats | Trainer clair/sombre | Tactiques clair/sombre | Partie libre et bilan | Plateau d’ouverture | Plateau tactique |
| -------- | ----------------------------- | -------------------- | ---------------------- | --------------------- | ------------------: | ---------------: |
| 320 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              259 px |           288 px |
| 375 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              314 px |           343 px |
| 390 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              329 px |           358 px |
| 430 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              369 px |           398 px |
| 820 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              702 px |           740 px |
| 1440 px  | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              832 px |           870 px |

Hauteurs simulées : 844 px pour les cinq premiers formats, 1000 px sur desktop. Le bas du composant Indice | Solution se situe entre **329 et 340 px sur les quatre formats téléphone** au début d’une séance. Les fiches finales ont aussi été contrôlées aux quatre largeurs, sans débordement. Le panneau passe sous le plateau sur petit écran et reste latéral sur desktop.

Mesures avec `scripts/audit-responsive.js` : rectangles des composants, largeur de défilement, cartes, nouveaux modes, assistance et fiches tactiques. Captures réelles complémentaires en clair/sombre. Les simulations ne remplacent pas des appareils physiques. Chromium a été exécuté ; Safari/Firefox restent vérifiés par les cibles du build, pas par une nouvelle exécution. Les contrôles clavier reposent sur les éléments natifs, leurs rôles/focus et les tests de l’échiquier ; pas de clavier physique testé.

## Archive : précédente mise à jour débutants et petits écrans

Les points ci-dessous décrivent la version précédente. Son indice automatique et son libellé « Voir le coup » ont été remplacés par le système facultatif décrit ci-dessus ; les contrôles historiques restent documentés.

- L’indice apparaît avant chaque coup de l’élève, sans action ni incrément de compteur. Il décrit des faits issus du coup légal de chess.js et reste distinct de l’explication pédagogique conservée après le coup. Aucun changement de ligne ou de décision du moteur.
- « Voir le coup » est placé sous le titre, avant le plateau. Deux clics pendant le même tour donnent une seule aide, le nom de la pièce, les coordonnées et la flèche existante. Après le bon coup, la flèche et les coordonnées disparaissent ; l’indice suivant arrive après la réponse scriptée.
- Italienne / Giuoco Piano / essentielle : indice du pion devant le roi, révélation e2 → e4, deux clics = 1 aide, d2 → d4 refusé avec croix rouge, e2 → e4 validé avec coche verte, e5 automatique, puis indice du cavalier et révélation g1 → f3. Recommencer remet les compteurs à zéro.
- Française / Avance / étendue : Noirs en bas, pas d’indice pendant le premier coup blanc automatique ; indice du pion devant le roi, flèche e7 → e6, deux clics = 1 aide ; e6 accepté, d4 automatique puis indice du pion devant la dame. Le changement de thème conserve l’exercice.
- Parties libres : e4 joué contre le vrai Stockfish Débutant, réponse e5 et retour « À toi de jouer ». Dernier bilan sauvegardé restauré sans nouveau calcul ; navigation précédent, commentaire, résumé, graphique et orientation conservés. Aucune modification des fichiers de la partie libre.
- Accueil : titres **OUVERTURES** et **ENTRAÎNEMENT LIBRE**, carte entière et flèche dans un seul lien natif, sans bouton imbriqué. Les deux flèches ont déclenché leur navigation dans le navigateur. Le focus, le rôle lien, les destinations et l’activation par clic clavier sont testés automatiquement. La simulation navigateur des touches natives Tab/Entrée ne déplaçait pas le focus dans cet environnement ; elle n’est pas présentée comme une validation clavier physique.
- Seule la signature « L’art de progresser » reste en italique ; les autres titres sont droits. Bordures fines et atténuées, espacements et tailles de cartes adaptés au téléphone. Les décorations de l’accueil sont dimensionnées sans débordement ; aucun masquage global du débordement n’a été ajouté.
- Stockfish affiche « Analyse locale active » depuis le build. Console de ces parcours sans avertissement ni erreur. Thèmes clair/sombre contrôlés et préférence toujours mémorisée.

### Mesures dans Chromium, depuis le build final

| Largeur du viewport | Accueil clair/sombre | Catalogue et sélection | Trainer clair/sombre | Partie libre : réglages et bilan | Largeur du plateau d’ouverture |
| ------------------- | -------------------- | ---------------------- | -------------------- | -------------------------------- | -----------------------------: |
| 320 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         259 px |
| 375 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         314 px |
| 390 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         329 px |
| 430 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         369 px |
| 820 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         702 px |
| 1366 px             | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         742 px |

Contrôle des rectangles visibles, `scrollWidth`/`clientWidth`, du viewport et de la largeur du plateau avec `scripts/audit-responsive.js`, complété par des captures réelles. Ce fichier contient une fonction de lecture du DOM à exécuter dans un navigateur disposant d’un moteur de rendu, pas dans jsdom. Pour reproduire : afficher chaque vue à chacune des six largeurs, appeler la fonction, puis vérifier `issues.length === 0` ; tout résultat non vide est un échec. Les redimensionnements sont attendus jusqu’à ce que `innerWidth` corresponde à la largeur demandée. Les contrôles de mise en page sont complémentaires aux 637 tests unitaires/UI, qui ne prétendent pas mesurer le rendu dans jsdom.

Sur mobile, le bas du bouton « Voir le coup » se situe environ entre 382 et 439 px depuis le haut de page selon le texte révélé. Il est donc accessible dès le premier écran dans les hauteurs 780/844 px utilisées. Les plateaux conservent leurs grandes dimensions ; à 1366 px, le panneau reste à droite. Les contrôles de largeur ont aussi été exécutés à 900 px de hauteur. Pas de téléphone physique ni de nouvelle exécution dans Safari/Firefox : ces limites restent celles précisées plus bas.

## Contrôle conservé de la refonte UX/UI du 30 août

- Trois vues distinctes : Accueil, Ouvertures, Partie libre. Navigation par fragments `#/`, `#/ouvertures`, `#/partie`, compatible avec une actualisation sous le préfixe GitHub Pages. Retour du navigateur contrôlé.
- Thèmes clair et sombre vérifiés dans le build : le choix survit à l’actualisation. Basculer pendant une séance conserve la position, les erreurs, les aides et le format.
- Palette crème/pierre/vert en clair, verts profonds en sombre. Tous les composants, sélecteurs, modales, bilans et la page de licences suivent la palette. Transitions discrètes et préférence de réduction des animations respectée.
- Douze pièces classiques **cburnett** en SVG local, attribution Colin M. L. Burnett et GPLv3 fournie, sources vectorielles incluses dans l’archive distribuée. Toutes les images de pièces se chargent correctement sous `/chess-progress-trainer/pieces/`.
- À **1366 × 900**, plateau d’ouverture de **742 px** avec panneau latéral de 340 px. La taille s’adapte à la largeur et à la hauteur de l’écran. À 820 px, le plateau d’analyse atteint **740 px** et le panneau passe dessous. À 390 px : plateau d’ouverture **329 px**, plateau de partie/bilan **358 px**.
- Largeurs **320, 390, 820, 1366 et 1440 px** contrôlées, sans débordement horizontal du contenu. Aucun téléphone physique utilisé.
- Italienne / Giuoco Piano essentielle : refus de d2–d4, compteur d’erreurs, flèche e2–e4, badge vert et réponse scriptée e7–e5. Française / Avance étendue sur mobile : Noirs en bas, e4 automatique ; d7–d5 refusé avec croix en d5, e7–e6 accepté avec coche en e6, réponse d4. Réinitialisation des compteurs et du mode contrôlée.
- Parcours final de l’Italienne essentielle jusqu’au bilan **7/7**, avec sept aides et zéro erreur. Glisser-déposer réel de c2 vers c3 avec les nouveaux SVG ; modale de fin et bouton Rejouer contrôlés, compteurs remis à zéro.
- Vraie partie libre **Débutant, Noirs** : `1. e4 e5 2. d4 Cf6 3. Cf3`, choix de l’ordinateur effectué par Stockfish. Abandon confirmé, analyse séquentielle terminée, bilan de deux décisions sauvegardé puis restauré. e5 est classé Meilleur coup ; Cf6 Imprécision avec suggestion exd4 et suite proposée. Aucun changement des règles de classification.
- Bilan dans les deux thèmes : précédent/suivant, flèche sur la position avant le coup et sélection par clic réel dans la courbe contrôlés. Le graphique ajuste son repère à la largeur de l’écran afin de ne plus comprimer ou étirer ses libellés ; les valeurs extrêmes restent bornées.
- Stockfish affiche « Analyse locale active » dans le trainer et répond effectivement dans le mode libre. Les modules moteur, les règles d’échecs, les données d’ouverture et les calculs de bilan n’ont pas été modifiés.
- Console du build sans erreur ni avertissement durant ces parcours. Le build et le formatage passent sans avertissement. Les validations historiques ci-dessous restent documentées séparément.

## Parcours dans un vrai navigateur

Chromium intégré, en développement puis depuis **le build `dist/`**, servi à `http://127.0.0.1:4173/chess-progress-trainer/`.

### Parcours historiques conservés : partie libre et bilan

- **Débutant, Blancs** : tentative e2–e5 refusée, pion conservé en e2 et badge rouge ; partie `1. e4 e6 2. Cf3 d5 3. exd5 c6`, choisie librement par le vrai Stockfish. Abandon annulé une première fois, puis confirmé. Bilan de trois décisions, terminé sans erreur moteur.
- **Intermédiaire, Noirs** : premier coup blanc automatique, Noirs en bas ; partie `1. Cf3 c5 2. Cc3 e6 3. e4`. Abandon et bilan des deux décisions des Noirs. Signes des évaluations et commentaires contrôlés.
- **Expert, Blancs** : vraie partie terminée par mat après `1. f3 e5 2. g4 Dh4#`. Résultat « Défaite — Échec et mat », plateau bloqué. Bilan : f3 est une imprécision, g4 une gaffe, score après g4 `−M1`, commentaire prudent sur le mat forcé et proposition Cc3. Le graphique représente le mat sans déformer l’échelle.
- Navigation précédent/suivant/début ; sélection dans l’historique ; badge vert pour les bons coups, rouge pour g4. Flèche de d2 vers d4 sur la **position avant Cf3**, suite proposée de six demi-coups en français.
- Rechargement de la page après le premier bilan : accès **Configurer une partie → Revoir le bilan**, avec la partie, les commentaires et le même résumé restaurés sans nouveau calcul.
- Formats téléphone **390 × 844** et tablette **820 × 1180** : partie avec les Noirs, commandes, bilan et graphique accessibles, aucun élément du contenu ne déborde horizontalement. Une seule instance du plateau et du panneau de bilan dans le DOM.
- Petit écran **320 × 780** : bilan sans débordement, échiquier de 288 px, commandes précédent/suivant utilisables. Un clic réel dans la courbe sélectionne la position correspondante ; les coordonnées et les bornes sont également vérifiées dans le test du graphique.
- Console de production : aucun avertissement ni erreur pendant ces parcours. Le test unitaire de protocole couvre en plus le `stop`, l’ignorance des réponses tardives et les annulations à chaque phase ; le test UI vérifie la destruction du Worker à la sortie du bilan.
- Le **trainer d’ouvertures a été recontrôlé après l’ajout** : Italienne/Giuoco Piano essentielle jusqu’au bilan 7/7 avec aide, refus de d4, badges rouge/vert, réponses prévues et barre active. Française/Avance étendue : Noirs en bas, e4 automatique, flèche e7–e6 et coup e6 accepté.

### Contrôles conservés de l’évolution du catalogue

- Accueil : deux sections de cinq cartes, six variantes par carte, deux niveaux explicites. Le bouton Commencer reste désactivé tant qu’aucun niveau n’est sélectionné.
- Italienne étendue sur ordinateur : mauvaise tentative d2–d4 refusée, pion conservé en d2, case d4 rouge et croix ; e2–e4 accepté, case verte et coche avant la réponse e7–e5. Stockfish actif.
- **Londres / Fianchetto avec d5 / Version étendue** : parcours complet 12/12 jusqu’au bilan, 0 erreur, 12 aides ; les roques et les échanges sont joués réellement sur l’échiquier.
- **Est-Indienne / Petrosian / Version étendue** sur smartphone simulé : Noirs en bas, premier coup d4 automatique ; d7–d5 refusé avec badge en d5, g8–f6 accepté avec badge en f6. Parcours complet 14/14, bilan avec 1 erreur et 13 aides.
- Rejouer l’Est-Indienne : progression 0/14, erreurs 0, aides 0, même mode conservé.
- **Viennoise / Gambit viennois / Ligne essentielle** : mauvais glisser-déposer d2–d4 refusé avec retour en d2 et croix rouge ; glisser-déposer e2–e4 accepté ; parcours jusqu’au bilan 6/6, 1 erreur et 5 aides.
- **Sicilienne / Dragon / Ligne essentielle** sur tablette simulée : premier coup e4 automatique, moteur actif, parcours complet 6/6, 0 erreur et 6 aides.
- Mode essentiel et mode étendu également parcourus jusqu’au bilan dans les tests UI de la Caro-Kann ; l’Italienne essentielle conserve son parcours de non-régression.
- Console sans avertissement ni erreur pendant les contrôles de production.

## Moteur et fichiers de production

- **Stockfish 18 Lite fonctionne toujours** depuis le build : état « Analyse locale active », évaluation numérique puis nouvelles valeurs après les coups.
- JavaScript et WASM servis localement sous `/chess-progress-trainer/engine/` ; WASM HTTP 200, type `application/wasm`, **7 295 411 octets**.
- Vérification des empreintes du moteur, des sources amont, du réseau NNUE et des licences à chaque build.
- Sources de cette version régénérées dans `source/chess-progress-source.tar.gz`, liées depuis la page de licences.
- Le trainer ne reçoit aucun coup de Stockfish. Les messages `bestmove` terminent seulement l’analyse ; leur contenu n’est pas interprété.
- L’analyse précédente est arrêtée et ses scores tardifs ignorés. Aucune analyse du catalogue au démarrage.
- Bundle principal après refonte : environ **470 ko de JavaScript (126 ko gzip)** et **29 ko de CSS (7 ko gzip)**. Le module Partie libre chargé à la demande ajoute environ **39 ko de JavaScript (14 ko gzip)** et **14 ko de CSS (3 ko gzip)**. Aucun nouveau moteur ou paquet npm n’a été ajouté. Les archives de sources ne sont pas téléchargées pour jouer.
- Partie libre : Skill 0/7/20, limites respectives profondeur 3/8/18 et 100/350/1 200 ms. Bilan : Skill 20, profondeur 14 ou 350 ms par position, Worker unique, Hash 16 Mo. Les fichiers Stockfish locaux sont réutilisés.

## Responsive et limites

Largeurs contrôlées : **320, 390, 768 et 1280 px**. Aucun débordement horizontal. Panneau sous le plateau sur mobile/tablette, à droite sur ordinateur. Sélecteur de niveau et bilan utilisables à 390 × 844. Les badges sont placés dans la case elle-même : aucune conversion fragile des coordonnées lorsque le plateau est retourné.

Chrome/Chromium a été exécuté réellement. Les cibles Firefox 104+ et Safari 16+ sont vérifiées par le build et les API employées, **pas par une exécution dans ces navigateurs**. Aucun téléphone physique n’a été utilisé. Les tailles mobiles sont simulées ; le déplacement en deux touches et le glisser-déposer de la bibliothèque sont conservés.

Les prolongements sont des scénarios pédagogiques cohérents, pas une promesse de meilleurs coups forcés ni une validation par un professeur d’échecs. Ils expliquent notamment les ruptures, les colonnes ouvertes, les trajets de cavaliers et les échanges de structure.

Le bilan de partie libre repose sur des recherches courtes, une classification propre au projet et des commentaires à règles locales. Il n’offre pas la profondeur d’un service d’analyse prolongée ni des explications humaines exhaustives. La précision n’est pas une métrique officielle Chess.com. Les niveaux ne garantissent aucun Elo ; même Débutant peut être difficile pour un novice. La sauvegarde concerne uniquement la dernière partie terminée et dépend de l’autorisation de stockage du navigateur.

## Livraison locale

- Version de développement : `http://127.0.0.1:5173/chess-progress-trainer/`.
- Version de production locale : `http://127.0.0.1:4173/chess-progress-trainer/`.
- Pas de push, pas de déploiement, pas de modification des paramètres GitHub.
- Les licences et le workflow Pages sont conservés. Aucune action GitHub n’est nécessaire pour essayer cette évolution en local.
