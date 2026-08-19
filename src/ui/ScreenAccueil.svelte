<script lang="ts">
  import { demanderPermission, verrouillerPortrait } from '../lib/orientation';
  import { jeu } from '../game/session.svelte';
  import type { ModeId } from '../game/modes';

  let occupe = $state(false);

  /*
   * iOS 13+ : la permission ne s'obtient que depuis un vrai geste. Ce bouton
   * est donc à la fois la demande et le démarrage — il n'y en a pas d'autre.
   */
  async function entrer(mode: ModeId): Promise<void> {
    if (occupe) return;
    occupe = true;
    const reponse = await demanderPermission();
    occupe = false;

    if (reponse === 'refusee' || reponse === 'indisponible') {
      jeu.aller('refus');
      return;
    }
    void verrouillerPortrait();
    jeu.mode = mode;
    jeu.aller(mode === 'tournee' ? 'noms' : 'calibration');
  }
</script>

<div class="couche accueil entree">
  <header>
    <h1 class="titre">À ras<br />bord</h1>
    <p class="corps">
      Tenir le verre pendant une minute sans en renverser une goutte. Le liquide
      est en retard sur ta main.
    </p>
  </header>

  <div class="pousse"></div>

  <nav>
    <button class="bouton" data-ton="primaire" disabled={occupe} onclick={() => entrer('tiens-bon')}>
      Tiens bon — 60 s
    </button>
    <button class="bouton" disabled={occupe} onclick={() => entrer('tournee')}>
      La tournée — à plusieurs
    </button>
  </nav>
</div>

<style>
  header {
    max-width: 22ch;
  }

  h1 {
    margin-bottom: var(--e4);
  }

  nav {
    animation: fondu 1.2s 1.6s cubic-bezier(0.2, 0.6, 0.2, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    nav {
      animation: none;
    }
  }
</style>
