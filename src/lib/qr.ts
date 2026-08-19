import qrcode from 'qrcode-generator';

export interface Qr {
  modules: number;
  /** Un seul chemin SVG : un rect par module noircirait le DOM pour rien. */
  chemin: string;
}

export function encoder(texte: string): Qr {
  const qr = qrcode(0, 'L');
  qr.addData(texte);
  qr.make();

  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return { modules: n, chemin: d };
}
