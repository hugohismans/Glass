<script lang="ts">
  import Stage from './ui/Stage.svelte';
  import ScreenAccueil from './ui/ScreenAccueil.svelte';
  import ScreenCalibration from './ui/ScreenCalibration.svelte';
  import ScreenClassement from './ui/ScreenClassement.svelte';
  import ScreenDesktop from './ui/ScreenDesktop.svelte';
  import ScreenFin from './ui/ScreenFin.svelte';
  import ScreenJeu from './ui/ScreenJeu.svelte';
  import ScreenNoms from './ui/ScreenNoms.svelte';
  import ScreenPassage from './ui/ScreenPassage.svelte';
  import ScreenRefus from './ui/ScreenRefus.svelte';
  import { estMobile } from './lib/orientation';
  import { jeu } from './game/session.svelte';

  if (!estMobile()) jeu.aller('desktop');
</script>

<Stage />

{#if jeu.ecran === 'desktop'}
  <ScreenDesktop />
{:else if jeu.ecran === 'accueil'}
  <ScreenAccueil />
{:else if jeu.ecran === 'calibration'}
  <ScreenCalibration />
{:else if jeu.ecran === 'noms'}
  <ScreenNoms />
{:else if jeu.ecran === 'passage'}
  <ScreenPassage />
{:else if jeu.ecran === 'jeu'}
  {#key jeu.tour}
    <ScreenJeu />
  {/key}
{:else if jeu.ecran === 'fin'}
  <ScreenFin />
{:else if jeu.ecran === 'classement'}
  <ScreenClassement />
{:else if jeu.ecran === 'refus'}
  <ScreenRefus />
{/if}
