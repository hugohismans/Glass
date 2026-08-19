# À Ras Bord

Un verre rempli à ras bord. Le téléphone **est** le verre : incliner le penche,
secouer le fait clapoter, et ce qui déborde ne revient jamais. Le score, c'est
ce qu'il reste.

Jeu web mobile uniquement — Vite, TypeScript, Svelte 5 (runes), Canvas 2D. Pas
de moteur physique, pas de backend, rien en mémoire au-delà de la partie.

## Modes

- **Tiens bon** — soixante secondes, seul, sans rien renverser.
- **La tournée** — dix secondes chacun sur un seul téléphone, puis on passe.
  Le liquide, lui, ne s'arrête pas entre deux mains. Le dernier a un gage.

## Lancer en local

```sh
npm install
npm run dev        # https://localhost:5173 — et l'adresse réseau
```

Le serveur de développement sert en **HTTPS** (`@vitejs/plugin-basic-ssl`) et
écoute sur toutes les interfaces : c'est indispensable, les navigateurs mobiles
refusent l'accès aux capteurs de mouvement en clair.

### Tester le gyroscope depuis un vrai téléphone

1. `npm run dev` affiche une ligne `Network: https://192.168.x.x:5173/`.
2. Ouvre cette adresse sur le téléphone, sur le même réseau Wi-Fi.
3. Le certificat est auto-signé : accepte l'avertissement une fois
   (« Avancé » → « Continuer »). Sans ça, pas de `deviceorientation`.
4. Sur iOS 13 et plus, le premier bouton de l'écran d'accueil déclenche la
   demande de permission — elle ne peut venir que d'un vrai geste.

Sur ordinateur, le jeu affiche un écran dédié avec un QR code vers l'adresse
courante. Il n'y a pas de repli souris : sans capteur, il n'y a pas de verre.

## Commandes

```sh
npm run dev       # développement, HTTPS, --host
npm test          # la physique du liquide (Vitest)
npm run check     # svelte-check, TypeScript strict
npm run build     # check + bundle de production dans dist/
npm run preview   # sert dist/ en HTTPS
```

## Déployer sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie à chaque push
sur `main`. Il passe `BASE_PATH=/<nom-du-dépôt>/`, que `vite.config.ts` lit pour
préfixer les assets.

Côté dépôt, une seule chose à régler : **Settings → Pages → Source → GitHub
Actions**. Le site est alors servi en HTTPS, ce qui est également requis en
production pour l'accès aux capteurs.

Pour publier ailleurs :

```sh
BASE_PATH=/mon-chemin/ npm run build
```

## Comment c'est fait

```
src/lib/       la physique et les entrées. Aucun DOM, aucun canvas.
   liquid.ts     ressort amorti + deux harmoniques + débordement (testé)
   constants.ts  toutes les constantes de ressenti, au même endroit
   orientation.ts permission iOS, calibration, reconstruction de la pesanteur
   loop.ts       boucle à pas de simulation fixe (120 Hz)
src/render/    lit un état, dessine. Ne modifie jamais rien.
src/game/      moteur de partie et machine à états d'écran
src/ui/        les écrans, en Svelte
```

Trois règles tenues d'un bout à l'autre :

1. **La physique ignore l'affichage.** `liquid.ts` n'importe rien d'autre que
   ses constantes, et se teste sans navigateur.
2. **L'affichage ignore l'interface.** Le canvas se dessine hors du cycle
   réactif ; pendant une partie, le moteur écrit le chrono et les millilitres
   directement dans le DOM et aucune rune n'est touchée.
3. **Rien n'est décoratif.** Chaque élément visible est une conséquence du
   liquide ou de la lampe — le liseré, le ménisque, la réfraction, la
   condensation, et surtout la tache de lumière sur la table, calculée par
   réfraction depuis la même surface que le liquide.

## Régler le ressenti

Tout est dans `src/lib/constants.ts`.

| Constante | Effet |
|---|---|
| `SPRING_K` | fréquence du ballottement — plus haut, plus nerveux |
| `SPRING_C` | amortissement — plus bas, plus d'oscillations |
| `SLOSH_GAIN`, `SHAKE_GAIN` | ce que rapportent les à-coups et les secousses |
| `SPILL_RATE`, `SPILL_EXP` | sévérité du débordement (`EXP > 1` punit le geste brusque) |
| `VOLUME_START_ML` | marge de départ sous le bord |

Les tests de `src/lib/liquid.test.ts` vérifient les invariants, pas les
valeurs : on peut retoucher les constantes sans casser la suite.
