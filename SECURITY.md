# Audit local de sécurité — 31 août 2026

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
