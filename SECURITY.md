# Audit local de sécurité — 2 septembre 2026

## Zone pédagogique, progression, glossaire et refonte du bilan

`pnpm audit --json` signale **0 vulnérabilité** critique, haute, modérée, faible ou informative parmi 219 dépendances. **Aucune dépendance ajoutée**, aucun changement du lockfile, aucune ressource distante. Le détecteur de secrets ne trouve rien : **250 fichiers, 11 commits accessibles, 394 blobs historiques**.

La refonte du Game Review ne change ni le protocole UCI, ni les bornes de recherche, ni la calibration. Elle travaille uniquement sur le rapport déjà validé en mémoire : positions, meilleur coup, SAN, évaluations et classifications. Les coups UCI utilisés par les deux flèches passent toujours par `bestMoveArrow`, qui rejette une valeur absente, mal formée ou illégale, et par la validation `chess.js`. **Le coup joué n’est jamais reconstruit depuis le stockage** : il provient du rejeu de la partie déjà validée. Changer de coup, de classification, ouvrir le fil de la partie ou déplacer le curseur ne crée aucun Worker et ne déclenche aucune recherche ; un test automatisé le vérifie sur l’ensemble de ces interactions.

La progression ajoute un champ `reviewedGames` à la structure locale versionnée. Il est validé comme les autres listes de chaînes — éléments non textuels rejetés, longueur unitaire bornée, doublons supprimés, 200 entrées au maximum — et une sauvegarde antérieure sans ce champ repart d’une liste vide. Les identifiants de badge restent contraints à `^[a-z0-9-]{2,40}$` ; les vingt identifiants par ouverture respectent ce format. Aucun compte, aucun serveur, aucun transfert entre appareils.

Le glossaire construit son expression rationnelle à partir des seules clés déclarées dans `src/data/glossary.ts` et de leurs alias, chaque libellé étant échappé avant assemblage. Les textes décorés proviennent des données du produit, jamais du stockage : aucun contenu restauré n’est interprété comme du balisage. Les infobulles restent du texte.

Le build conserve la vérification d’intégrité des ressources Stockfish, la distribution des sources GPL, la politique CSP `default-src 'none'` avec `script-src 'self' 'wasm-unsafe-eval'` et `worker-src 'self'`, l’en-tête `no-referrer` et le préfixe `/chess-progress-trainer/`. Le lien « Code source de l’application » de la page des licences pointe désormais vers le dépôt réel, `github.com/alexis-morais/chess-progress-trainer` : c’est une correction de conformité GPL, l’ancienne adresse ne répondait pas.

Aucun commit, push ou déploiement n’a été effectué pendant cet audit.

---

# Audit local de sécurité — 1er septembre 2026

## Game Review filtré et identité versionnée

Le contrôle final porte sur **243 fichiers**, dix commits accessibles et 375 blobs historiques : aucune occurrence sensible détectée. `pnpm audit --json` signale **0 vulnérabilité** critique, haute, modérée, faible ou informative parmi 219 dépendances. Aucune dépendance ni ressource distante n’a été ajoutée.

La navigation du bilan travaille uniquement sur le rapport déjà validé en mémoire. Les coups UCI utilisés par la flèche passent par la même validation `chess.js` que le moteur ; une valeur absente, mal formée ou illégale ne produit aucun overlay. Cliquer une classification ou changer de position ne crée aucun Worker et ne déclenche aucune recherche Stockfish.

Le header charge le masque SVG local depuis `import.meta.env.BASE_URL`. Les favicon SVG/PNG, l’Apple Touch Icon et le masque Safari sont des ressources statiques locales aux noms `v3`, compatibles avec `img-src 'self' data:`. Le build conserve la CSP, `no-referrer` et le préfixe GitHub Pages. Les cinq ressources répondent en HTTP 200 dans la prévisualisation de production.

## Finition produit : pédagogie, progression et contrôle mobile

L’audit des dépendances a été relancé : **0 vulnérabilité connue** (11 dépendances d’exécution, 208 de développement, 219 au total). Aucune dépendance ajoutée, aucun changement du lockfile. Les nouveaux dessins utilisent les SVG et pièces locaux déjà licenciés. Aucun service, compte, appel distant ou secret n’a été ajouté.

Le contrôle final des secrets n’a trouvé aucun résultat positif : 238 fichiers examinés, neuf commits accessibles et 337 blobs historiques. Les essais de calibration restent locaux et sont identifiés séparément des mesures de la politique livrée.

La calibration s’exécute uniquement dans les scripts locaux, avec le moteur WASM du projet. Ses FEN et coups passent par chess.js ; les résultats restent des fichiers locaux. Elle n’est pas chargée ou exécutée par la page d’accueil. La sélection de coups modifiée ne s’applique qu’à la Partie libre ; les limites et validations du protocole UCI n’ont pas changé.

Le build vérifie toujours l’intégrité des ressources Stockfish, distribue les sources GPL et applique la CSP. Le timeout CI de 20 secondes et la limite de deux processus de test sont conservés. Les sections suivantes gardent le détail des audits antérieurs et ne décrivent pas de nouvelles modifications de sécurité.

## Complément mobile et difficulté 1–25

Nouvel audit des dépendances : **aucune vulnérabilité connue** (11 dépendances d’exécution, 208 de développement, 219 au total). Le détecteur de secrets ne relève aucun résultat positif dans les sources et les 7 commits locaux accessibles, soit 215 blobs texte historiques. Aucun commit n’a été créé par cette mise à jour.

Les profils numériques sont bornés à 1–25. Le dernier niveau tolère un stockage absent, inaccessible ou corrompu. Les anciennes difficultés sont migrées vers 3/8/25, avec revalidation de la partie et de son bilan. Les options UCI sont contrôlées selon les bornes réellement annoncées ; FEN, historique et PV sont validés, les lignes trop longues ignorées, les recherches restent séquentielles et annulables. Le bilan réinitialise les options pour ne jamais hériter de l’affaiblissement du jeu.

CSP, no-referrer, permissions GitHub Actions, licences et timeout CI de 20 secondes restent en place. Aucune nouvelle dépendance, API, ressource distante, clé ou collecte de données. Deux processus de test au maximum limitent seulement la contention CPU ; les mêmes tests restent bloquants.

Le rapport ci-dessous décrit les protections héritées ; la migration des anciennes difficultés constitue l’ajout de cette version.

Application React/Vite statique, sans compte, serveur applicatif, paiement, clé API ou collecte de données. Cet audit porte sur les sources, la configuration, les fichiers publics, le build et les six commits accessibles dans l’historique Git local. Ce n’est pas une certification ni un test d’intrusion exhaustif.

## Constats et corrections

| Point contrôlé            | Résultat / mesure                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets                   | Aucun secret détecté par les motifs examinés : clés privées, jetons GitHub, clés OpenAI/AWS/Google, valeurs Bearer, identifiants dans les URLs et affectations de credentials. Six commits et 187 versions de fichiers Git examinés. Aucun secret imprimé.                                                                    |
| Dépendances               | `pnpm audit --json` : **0 critique, 0 haute, 0 modérée, 0 faible** parmi les dépendances connues du registre. Aucune mise à jour générale ni changement du lockfile nécessaire.                                                                                                                                               |
| Stockage de partie        | La validation existante rejoue les coups et vérifie le résultat. Renforcement des types des dates ; rejet des scores ambigus contenant à la fois `cp` et `mate`. Les propriétés supplémentaires sont retirées des objets restaurés.                                                                                           |
| Cache du bilan            | Un cache corrompu est écarté sans perdre la partie légale. Le bilan et ses commentaires sont reconstruits localement ; aucun commentaire HTML provenant du stockage n’est affiché. Les anciennes sauvegardes valides restent compatibles, sans migration.                                                                     |
| Messages Stockfish        | Messages non textuels ignorés ; taille maximale de message 64 K caractères. Scores et profondeurs bornés, entiers sûrs, rejet des valeurs non finies ou tronquées. Les barrières UCI, annulations et délais existants sont conservés.                                                                                         |
| Injection HTML/JavaScript | Aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou `new Function` dans le code de l’application. Textes rendus par React. Pas d’URL utilisateur ou de HTML importé.                                                                                                                                                      |
| URLs                      | Navigation interne limitée à trois vues connues. Liens externes issus des données statiques du dépôt, pas du stockage ; liens en nouvel onglet déjà protégés par `rel="noreferrer"` (qui implique `noopener`).                                                                                                                |
| Thème                     | Seulement `light` ou `dark` acceptés, sinon thème système ; stockage refusé/corrompu toléré.                                                                                                                                                                                                                                  |
| Actions GitHub            | Installation `--frozen-lockfile`, permissions minimales : lecture du dépôt au build, écriture Pages et jeton OIDC seulement au déploiement. Ajout de `persist-credentials: false` au checkout. Timeout CI de **20 secondes par test inchangé**. Aucun secret personnalisé ni valeur utilisateur interpolée dans une commande. |

Les deux défauts de validation renforcés pouvaient produire un bilan incohérent avec un stockage modifié localement ; aucun chemin d’exécution de code distant n’a été trouvé. Ils ne sont pas présentés comme des vulnérabilités critiques.

Le `new Function` de `scripts/lib/stockfish-node.mjs` exécute **uniquement le fichier Stockfish local de provenance connue** pour la validation éditoriale hors navigateur. Celui du test de thème exécute le script local testé. Aucun des deux ne reçoit de contenu utilisateur et aucun n’est livré dans les bundles exécutés par la page. Le moteur tiers non modifié est couvert par les vérifications d’intégrité de `scripts/verify-assets.mjs` ; ses sources et licences restent distribuées.

## Politique navigateur du build

`scripts/harden-build.mjs` ajoute aux deux pages HTML de `dist/` :

- une CSP autorisant les scripts, Worker, connexions et polices de la même origine ;
- `script-src 'self' 'wasm-unsafe-eval'`, sans autoriser `eval` JavaScript ou les scripts inline ;
- les styles inline nécessaires aux positions de pièces, flèches et animations React ;
- les images locales et `data:`, aucun chargement d’image externe ;
- interdiction des objets, frames chargées par la page, formulaires et balises `base` ;
- `referrer: no-referrer`, pour ne pas transmettre l’adresse de la page aux sites visités.

La CSP est ajoutée **uniquement au build** : le serveur de développement Vite a besoin de scripts de rechargement et d’un WebSocket. Aucun serveur, nonce dynamique ou service supplémentaire n’est nécessaire. Les parcours de production, les modules chargés à la demande, les SVG, le Worker classique et le WASM local ont été vérifiés dans le navigateur sous `/chess-progress-trainer/`.

**Limites importantes :** `frame-src 'none'` empêche la page de charger des iframes ; il n’empêche pas un autre site de l’intégrer. `frame-ancestors` et `X-Frame-Options` exigent des en-têtes HTTP, pas une balise meta. Aucune fausse protection contre l’encadrement n’a été ajoutée. La CSP de la page ne gouverne pas le contexte d’un Worker externe ; une politique propre au Worker nécessiterait des en-têtes sur sa réponse HTTP. GitHub Pages n’est pas configuré ici pour fournir de tels en-têtes personnalisés.

Références primaires consultées : [CSP et WebAssembly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src), [CSP des Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#content_security_policy), [limite de frame-ancestors en meta](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

## Reproduire les contrôles

```sh
node scripts/audit-secrets.mjs
pnpm audit --json
pnpm test
CI=true pnpm test
pnpm build
pnpm preview
```

Le détecteur de secrets parcourt les fichiers texte, y compris `dist/` quand il existe, et les blobs texte accessibles par `git rev-list --objects --all`. Les dépendances installées, fichiers binaires et archives compressées ne sont pas inspectés par ce détecteur ; les entrées source de l’archive de l’application sont inspectées avant compression. Il ne contacte aucun serveur et n’affiche jamais une valeur détectée. Les motifs ne peuvent garantir l’absence de tout secret possible. Si un vrai secret est découvert, le révoquer auprès du fournisseur avant de nettoyer l’historique.

Le registre d’audit ne connaît pas toutes les failles possibles. Les actions officielles restent référencées par leur version majeure ; aucun accès distant ni audit de leurs infrastructures n’a été réalisé. Il faut protéger le compte GitHub, revoir les futures modifications et relancer ces contrôles avant publication.

Le code frontend est public par nature. `localStorage` est modifiable par le propriétaire du navigateur et accessible au JavaScript de la même origine ; il ne doit jamais contenir de secret. La précision du bilan n’est ni une preuve ni une donnée inviolable. Aucun tracking, anti-DevTools, obfuscateur, cookie marketing ou appel d’API externe n’a été ajouté.

**Aucun commit, push, changement distant ou déploiement n’a été effectué.**
