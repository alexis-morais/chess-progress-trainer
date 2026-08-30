# Stockfish.js 18 Lite Single-Threaded

Distribution inchangée du paquet npm `stockfish@18.0.8`, projet de Nathan Rugg / Chess.com, LLC, sous GPLv3.

- Projet : https://github.com/nmrugg/stockfish.js
- Commit exact indiqué par le registre npm : `93c994592dcf3b4b21052ab925e9b534df9c0918`.
- Binaires : https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-lite-single.js et https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-lite-single.wasm.
- Source correspondante : `stockfish-source-18.0.8.tar.gz`, copie intégrale de l’archive du commit ci-dessus, conservée à côté des binaires et servie par le même site.
- Réseau d’évaluation de Linmiao Xu : `nn-9067e33176e8.nnue`, également fourni à côté des sources (GPLv3). Le WASM inclut déjà ce réseau ; le fichier séparé sert uniquement à reconstruire le moteur.
- Licence complète : `../licenses/Stockfish-GPL-3.0.txt`.
- Auteurs : `../licenses/Stockfish-AUTHORS.txt`.
- Empreintes SHA-256 : `../../scripts/engine-manifest.json` dans le dépôt. Le build vérifie ces empreintes.

## Reconstruire

Les scripts `build.js`, `scripts/`, `src/Makefile` et tous les fichiers C++ sont inclus dans l’archive source. Installer Node.js, make et Emscripten **3.1.7**, comme indiqué par le projet amont. Extraire l’archive, copier le fichier `nn-9067e33176e8.nnue` dans son dossier `src/`, puis lancer depuis la racine extraite :

```sh
node build.js --lite --single-threaded --no-split
```

Les instructions et options complètes figurent dans le README amont inclus et `node build.js --help`. L’outil de compilation peut vérifier/télécharger des dépendances pendant une reconstruction ; **aucun de ces accès n’est nécessaire pour utiliser le trainer**.

Le moteur s’exécute dans un Web Worker classique, sans SharedArrayBuffer, COOP/COEP, serveur d’analyse ou API. Seul le JavaScript et le WASM sont téléchargés à l’ouverture d’une séance. Le code de Chess Progress ne lit jamais le coup contenu dans `bestmove` : ce message sert uniquement à savoir qu’une recherche UCI s’est terminée. L’adversaire suit les données pédagogiques.

Stockfish et cette application sont distribués sans garantie. Les marques de leurs auteurs respectifs restent leur propriété. Le prototype n’est affilié ni à Chess.com, ni à Lichess, ni à l’équipe Stockfish.
