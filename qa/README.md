# Contrôle visuel local du plateau

Lancer `pnpm dev`, puis ouvrir `/chess-progress-trainer/qa/board.html` sur le serveur local.

Cette page utilise le **même composant partagé** que l’application. Elle n’est pas une entrée du build Vite et n’est pas copiée dans le site publié. Aucun moteur ou stockage n’est utilisé.

Choisir une position, puis essayer clic-clic et glisser-déposer avec la souris. Les boutons de simulation maintiennent un geste `PointerEvent` de type `touch` : on peut observer la pièce agrandie, son décalage et les marqueurs avant de relâcher. Les scénarios couvrent les deux camps, une capture, les deux roques, la prise en passant, les quatre choix de promotion et un refus pédagogique.

La simulation utilise des événements synthétiques et neutralise la capture matérielle du pointeur **dans ce banc uniquement**. Elle permet de vérifier le rendu et les transitions ; elle ne simule pas l’arbitrage natif du scroll ni un véritable doigt. La capture du pointeur est vérifiée séparément par les tests automatisés et les gestes souris réels sur l’application. Pour tester la souris native dans ce banc après une simulation, recharger la page.

À vérifier sur appareil physique avant une diffusion large : geste démarré sur une pièce jouable (drag réservé), geste démarré sur une case vide ou hors plateau (défilement normal), zoom à deux doigts, interruption par le navigateur, rotation du téléphone. Tester Safari iOS et Chrome Android.

La règle `touch-action` doit être présente **avant** le premier contact : la définir seulement après franchissement du seuil est trop tard pour le navigateur. Ici, seules les cases contenant une pièce jouable réservent le geste à un doigt ; le reste de la page conserve son défilement. Référence : [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).
