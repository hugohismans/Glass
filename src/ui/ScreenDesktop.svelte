<script lang="ts">
  import { encoder } from '../lib/qr';

  const url = location.href;
  const qr = encoder(url);
  const propre = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
</script>

<div class="couche desktop entree">
  <header>
    <h1 class="titre">À ras<br />bord</h1>
    <p class="corps">
      Ce jeu se joue avec le gyroscope d'un téléphone. Il n'y a rien à faire ici
      — ouvre cette adresse sur le tien.
    </p>
  </header>

  <div class="pousse"></div>

  <figure>
    <svg viewBox="-2 -2 {qr.modules + 4} {qr.modules + 4}" role="img" aria-label="Code QR vers {propre}">
      <path d={qr.chemin} />
    </svg>
    <figcaption class="donnee">{propre}</figcaption>
  </figure>

  <div class="pousse"></div>
</div>

<style>
  .desktop {
    align-items: flex-start;
    padding-left: max(var(--e6), 8vw);
    padding-right: max(var(--e6), 8vw);
  }

  header {
    max-width: 26ch;
  }

  h1 {
    margin-bottom: var(--e4);
  }

  figure {
    display: flex;
    flex-direction: column;
    gap: var(--e3);
    align-items: flex-start;
  }

  svg {
    width: 168px;
    height: 168px;
    /* Le code prend la lumière de la lampe, comme le reste de la scène. */
    filter: drop-shadow(0 0 22px rgba(224, 154, 46, 0.22));
  }

  path {
    fill: var(--caustique);
    opacity: 0.86;
  }

  figcaption {
    margin: 0;
  }
</style>
