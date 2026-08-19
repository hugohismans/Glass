import { FIXED_DT, MAX_SUBSTEPS } from './constants';

/**
 * Boucle de rendu à pas de simulation fixe.
 * Le rendu suit le rafraîchissement de l'écran, la physique non : sur une
 * frame longue on rattrape en sous-pas, sinon le ressort explose.
 */
export class Loop {
  private raf = 0;
  private last = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly onStep: (dt: number) => void,
    private readonly onDraw: (frameDt: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.accumulator = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);

    const frameDt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    this.accumulator += frameDt;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
      this.onStep(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    /* Onglet en arrière-plan, frame de 2 s : on jette le retard. */
    if (steps === MAX_SUBSTEPS) this.accumulator = 0;

    this.onDraw(frameDt);
  };
}
