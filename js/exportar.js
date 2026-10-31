// Generación de imágenes PNG en alta resolución (etiqueta QR y matriz completa),
// dibujadas directamente en canvas para obtener el mismo resultado en cualquier dispositivo.
import { dibujarQR } from './qr.js';
import { fechaCorta, vacio, esNA } from './util.js';

const C = {
  naranja: '#F47A1F',
  naranjaOsc: '#A84A0A',
  naranjaSuave: '#FFF3E8',
  tinta: '#1F232B',
  tinta2: '#4A5260',
  tinta3: '#69707D',
  linea: '#E3DED6',
  fondo: '#FAF7F3',
  ambarFondo: '#FFF6DB',
  ambarBorde: '#E9B949',
  ambarTinta: '#5E4300',
  rojoFondo: '#FDECEA',
  rojoBorde: '#E8A39B',
  rojoTinta: '#7A1D14',
};
const F = { txt: 'Inter, system-ui, sans-serif', dsp: '"Inter Display", Inter, system-ui, sans-serif' };

export async function asegurarFuentes() {
  if (!document.fonts || !document.fonts.load) return;
  await Promise.all([
    document.fonts.load(`400 20px Inter`), document.fonts.load(`500 20px Inter`),
    document.fonts.load(`600 20px Inter`), document.fonts.load(`700 20px Inter`),
    document.fonts.load(`700 20px "Inter Display"`), document.fonts.load(`800 20px "Inter Display"`),
  ]).catch(() => {});
}

export function cargarImg(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const im = new Image();
    im.onload = () => res(im.naturalWidth ? im : null);
    im.onerror = () => res(null);
    im.src = src;
  });
}

function envolver(ctx, texto, ancho) {
  const lineas = [];
  String(texto ?? '').split(/\n/).forEach((parrafo) => {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    let l = '';
    for (let p of palabras) {
      while (ctx.measureText(p).width > ancho && p.length > 1) {
        // palabra más larga que el ancho: partirla
        let k = p.length - 1;
        while (k > 1 && ctx.measureText(p.slice(0, k)).width > ancho) k--;
        const guion = p.lastIndexOf('-', k - 1);
        if (guion > 0) k = guion + 1; // preferir cortar después de un guion
        if (l) { lineas.push(l); l = ''; }
        lineas.push(p.slice(0, k));
        p = p.slice(k);
      }
      const t = l ? `${l} ${p}` : p;
      if (ctx.measureText(t).width <= ancho) l = t;
      else { if (l) lineas.push(l); l = p; }
    }
    lineas.push(l);
  });
  return lineas;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Lienzo de dos pasadas: primero mide (seco), luego dibuja. */
class Lienzo {
  constructor(ctx, seco) { this.ctx = ctx; this.seco = seco; }
  fuente(px, peso = 400, fam = F.txt, cursiva = false) { this.ctx.font = `${cursiva ? 'italic ' : ''}${peso} ${px}px ${fam}`; }
  rect(x, y, w, h, color, radio = 0, borde = null, grosor = 2) {
    if (this.seco) return;
    const c = this.ctx;
    if (radio) { rr(c, x, y, w, h, radio); } else { c.beginPath(); c.rect(x, y, w, h); }
    if (color) { c.fillStyle = color; c.fill(); }
    if (borde) { c.strokeStyle = borde; c.lineWidth = grosor; c.stroke(); }
  }
  texto(t, x, y, color, alinear = 'left') {
    if (this.seco) return;
    const c = this.ctx;
    c.fillStyle = color; c.textAlign = alinear; c.textBaseline = 'alphabetic';
    c.fillText(t, x, y);
  }
  /** Párrafo envuelto. Devuelve la altura ocupada. */
  parrafo(t, x, y, ancho, px, peso, color, interlinea = 1.4, fam = F.txt, cursiva = false) {
    this.fuente(px, peso, fam, cursiva);
    const ls = envolver(this.ctx, t, ancho);
    const lh = Math.round(px * interlinea);
    ls.forEach((l, i) => this.texto(l, x, y + px + i * lh, color));
    return ls.length * lh;
  }
  img(im, x, y, w, h) { if (!this.seco && im) this.ctx.drawImage(im, x, y, w, h); }
}

function crearCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv;
}
const aBlob = (cv) => new Promise((r) => cv.toBlob(r, 'image/png'));

function valor(v, unidad = '') {
  if (vacio(v)) return { t: 'Por definir', vacio: true };
  if (esNA(v)) return { t: 'N/A', vacio: false };
  const s = String(v).trim();
  return { t: unidad && /^\d+([.,]\d+)?$/.test(s) ? `${s} ${unidad}` : s, vacio: false };
}

/* ---------------------------------------------------------------- Etiqueta QR */

export async function etiquetaQR({ titulo, eyebrow, detalle, url, pie, logoBlanco }) {
  await asegurarFuentes();
  const logo = await cargarImg(logoBlanco);
  const W = 1500;
  const medir = crearCanvas(10, 10).getContext('2d');
  const dibujar = (L) => {
    const c = L.ctx;
    let y = 0;
    // banda superior
    L.rect(0, 0, W, 300, C.naranja);
    if (logo) {
      const lw = 1040, lh = Math.round((logo.naturalHeight / logo.naturalWidth) * lw);
      L.img(logo, (W - lw) / 2, (300 - lh) / 2, lw, lh);
    } else {
      L.fuente(64, 800, F.dsp); L.texto('ZIJIN · CONTINENTAL GOLD', W / 2, 172, '#FFFFFF', 'center');
    }
    y = 300 + 90;
    L.fuente(40, 700);
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    L.texto(eyebrow.toUpperCase(), W / 2, y, C.naranjaOsc, 'center');
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    y += 40;
    // título ajustado al ancho
    let px = 124;
    L.fuente(px, 800, F.dsp);
    let ls = envolver(c, titulo, 1300);
    while ((ls.length > 2 || ls.some((l) => c.measureText(l).width > 1300)) && px > 64) {
      px -= 4; L.fuente(px, 800, F.dsp); ls = envolver(c, titulo, 1300);
    }
    ls.forEach((l, i) => L.texto(l, W / 2, y + px + i * Math.round(px * 1.08), C.tinta, 'center'));
    y += px + (ls.length - 1) * Math.round(px * 1.08) + 30;
    if (detalle) {
      L.fuente(44, 600);
      const tw = Math.min(1300, c.measureText(detalle).width + 80);
      L.rect((W - tw) / 2, y, tw, 80, C.naranjaSuave, 40);
      L.texto(detalle, W / 2, y + 55, C.naranjaOsc, 'center');
      y += 80;
    }
    y += 50;
    // QR
    const lado = 1060;
    L.rect((W - lado) / 2 - 2, y - 2, lado + 4, lado + 4, '#FFFFFF', 28, C.linea, 4);
    if (!L.seco) dibujarQR(c, url, (W - lado) / 2 + 30, y + 30, lado - 60, { oscuro: C.tinta });
    y += lado + 70;
    L.fuente(46, 700);
    L.texto('Escanee para consultar la matriz', W / 2, y, C.tinta, 'center');
    y += 56;
    L.fuente(28, 500);
    const u = url.replace(/^https?:\/\//, '');
    L.texto(u.length > 70 ? `${u.slice(0, 67)}…` : u, W / 2, y, C.tinta3, 'center');
    y += 60;
    // pie
    L.rect(0, y, W, 130, C.tinta);
    L.fuente(36, 600);
    L.texto(pie, W / 2, y + 78, '#FFFFFF', 'center');
    return y + 130;
  };
  const H = dibujar(new Lienzo(medir, true));
  const cv = crearCanvas(W, H);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  dibujar(new Lienzo(ctx, false));
  return aBlob(cv);
}

/* ---------------------------------------------------------- Matriz completa */

export async function imagenMatriz({ equipo, lubricantes, url, logoBlanco, src, lis = () => '', unidades = [] }) {
  await asegurarFuentes();
  const [logo, foto] = await Promise.all([cargarImg(logoBlanco), cargarImg(equipo.imagen ? src(equipo.imagen) : '')]);
  const fotosLub = await Promise.all(lubricantes.map((l) => cargarImg(l.imagen ? src(l.imagen) : '')));
  const lisImgs = await Promise.all(equipo.puntos.map((p) => cargarImg(lis(p.codigoLIS) ? src(lis(p.codigoLIS)) : '')));

  const W = 2400, PAD = 80, CW = W - PAD * 2;
  const medir = crearCanvas(10, 10).getContext('2d');

  const dibujar = (L) => {
    const c = L.ctx;
    // ---- Encabezado
    L.rect(0, 0, W, 210, C.naranja);
    if (logo) {
      const lh = 92, lw = Math.round((logo.naturalWidth / logo.naturalHeight) * lh);
      L.img(logo, PAD, (210 - lh) / 2, lw, lh);
    } else { L.fuente(56, 800, F.dsp); L.texto('ZIJIN · CONTINENTAL GOLD', PAD, 128, '#FFFFFF'); }
    L.fuente(60, 800, F.dsp); L.texto('CARTA DE LUBRICACIÓN', W - PAD, 108, '#FFFFFF', 'right');
    L.fuente(34, 600); L.texto('Matriz de cambio de aceite - MEM', W - PAD, 156, '#FFFFFF', 'right');
    let y = 210 + 70;

    // ---- Datos del activo + QR
    const qrLado = 330, infoW = CW - qrLado - 60;
    L.fuente(28, 700); L.texto(equipo.equipo ? 'EQUIPO' : 'ACTIVO', PAD, y + 28, C.naranjaOsc);
    let hTit = L.parrafo(equipo.equipo || equipo.activo, PAD, y + 40, infoW, 92, 800, C.tinta, 1.05, F.dsp);
    let yy = y + 40 + hTit + 10;
    const sub = [equipo.descripcion, equipo.activo && equipo.equipo ? `Matriz: ${equipo.activo}` : ''].filter(Boolean).join(' · ');
    if (sub) yy += 10 + L.parrafo(sub, PAD, yy, infoW, 34, 500, C.tinta2, 1.3);
    yy += 30;
    const campos = [
      ['Modelo', equipo.modelo || '—'],
      ['Flota', equipo.flota || '—'],
      ['Fecha de elaboración', fechaCorta(equipo.fechaElaboracion) || '—'],
      ['Última actualización', equipo.actualizado ? fechaCorta(equipo.actualizado) : '—'],
    ];
    const cw = infoW / 4;
    let maxH = 0;
    campos.forEach(([k, v], i) => {
      const x = PAD + i * cw;
      L.fuente(26, 600); L.texto(k.toUpperCase(), x, yy + 26, C.tinta3);
      const h = L.parrafo(v, x, yy + 40, cw - 30, 38, 600, C.tinta, 1.25);
      maxH = Math.max(maxH, h);
    });
    yy += 40 + maxH;
    if (unidades.length) {
      yy += 30;
      const fl = [...new Set(unidades.map((u) => u.flota).filter(Boolean))].join(', ');
      const mo = [...new Set(unidades.map((u) => u.modelo).filter(Boolean))].join(', ');
      L.fuente(26, 600); L.texto(`EQUIPOS (${unidades.length})${fl ? ` · FLOTA ${fl.toUpperCase()}` : ''}${mo ? ` · MODELO ${mo.toUpperCase()}` : ''}`, PAD, yy + 26, C.tinta3);
      yy += 40 + L.parrafo(unidades.map((u) => u.equipo).join(', '), PAD, yy + 34, infoW, 32, 600, C.tinta, 1.3);
    }
    const qx = W - PAD - qrLado;
    L.rect(qx, y, qrLado, qrLado, '#FFFFFF', 20, C.linea, 3);
    if (!L.seco) dibujarQR(c, url, qx + 14, y + 14, qrLado - 28, { oscuro: C.tinta });
    L.fuente(24, 600); L.texto('Escanee para ver en línea', qx + qrLado / 2, y + qrLado + 40, C.tinta3, 'center');
    y = Math.max(yy, y + qrLado + 50) + 60;

    // ---- Imagen del equipo + lubricantes
    const ancha = foto && foto.naturalWidth / foto.naturalHeight > 2;
    const imgW = ancha ? CW : 1340;
    let colX = PAD + imgW + 60, colW = CW - imgW - 60;
    let imgH;
    if (foto) {
      imgH = Math.min(1000, Math.round((foto.naturalHeight / foto.naturalWidth) * imgW));
      L.rect(PAD, y, imgW, imgH, '#FFFFFF', 20, C.linea, 3);
      const k = Math.min((imgW - 40) / foto.naturalWidth, (imgH - 40) / foto.naturalHeight);
      const fw = foto.naturalWidth * k, fh = foto.naturalHeight * k;
      if (!L.seco) {
        c.save(); rr(c, PAD, y, imgW, imgH, 20); c.clip();
        c.drawImage(foto, PAD + (imgW - fw) / 2, y + (imgH - fh) / 2, fw, fh);
        c.restore();
      }
    } else {
      imgH = 460;
      L.rect(PAD, y, imgW, imgH, C.fondo, 20, C.linea, 3);
      L.fuente(34, 600); L.texto('Imagen de puntos de lubricación no disponible', PAD + imgW / 2, y + imgH / 2 + 12, C.tinta3, 'center');
    }
    // lubricantes (debajo de la imagen si es ancha)
    let ly = y;
    if (ancha) { ly = y + imgH + 60; colX = PAD; colW = CW; }
    L.fuente(28, 700); L.texto('INFORMACIÓN DE LUBRICANTES', colX, ly + 28, C.naranjaOsc);
    ly += 56;
    const colBase = colX, anchoCol = ancha ? (CW - 30) / 2 : colW, lyBase = ly;
    lubricantes.forEach((lub, i) => {
      const th = 130;
      if (ancha) { colX = colBase + (i % 2) * (anchoCol + 30); colW = anchoCol; ly = lyBase + Math.floor(i / 2) * (th + 50); }
      L.rect(colX, ly, colW, th + 30, '#FFFFFF', 18, C.linea, 3);
      const fl = fotosLub[i];
      L.rect(colX + 15, ly + 15, th, th, lub.ficha ? '#FFFFFF' : C.fondo, 12);
      if (lub.ficha && !L.seco) {
        dibujarQR(c, lub.ficha, colX + 15, ly + 15, th, { oscuro: C.tinta, margen: 2 });
      } else if (fl && !L.seco) {
        const k = Math.min(th / fl.naturalWidth, th / fl.naturalHeight);
        const fw = fl.naturalWidth * k, fh = fl.naturalHeight * k;
        c.drawImage(fl, colX + 15 + (th - fw) / 2, ly + 15 + (th - fh) / 2, fw, fh);
      } else if (!L.seco) {
        // gota
        const cx = colX + 15 + th / 2, cy = ly + 15 + th / 2 + 8;
        c.beginPath(); c.moveTo(cx, cy - 46); c.bezierCurveTo(cx + 34, cy - 6, cx + 34, cy + 30, cx, cy + 30);
        c.bezierCurveTo(cx - 34, cy + 30, cx - 34, cy - 6, cx, cy - 46); c.fillStyle = C.naranja; c.fill();
      }
      const tx = colX + th + 40, tw = colW - th - 60;
      L.fuente(32, 700);
      const ls = envolver(c, lub.nombre, tw).slice(0, 2);
      ls.forEach((l, k) => L.texto(l, tx, ly + 58 + k * 40, C.tinta));
      L.fuente(26, 500);
      L.texto(`Punto${lub.puntos.length > 1 ? 's' : ''} ${lub.puntos.join(', ')}${lub.ficha ? ' · QR: ficha técnica' : ''}`, tx, ly + 58 + ls.length * 40 + 8, C.tinta2);
      ly += th + 30 + 20;
    });
    if (ancha && lubricantes.length) ly = lyBase + Math.ceil(lubricantes.length / 2) * (130 + 50);
    if (!lubricantes.length) { L.fuente(30, 500); L.texto('Sin lubricantes registrados', colX, ly + 30, C.tinta3); ly += 50; }
    y = Math.max(y + imgH, ly) + 70;

    // ---- Tabla de puntos
    const conNivel = equipo.puntos.some((p) => !vacio(p.revisionNivel));
    let cols = [
      ['Punto', 130], ['Componente', 270], ['Código lubricante (LIS)', 330], ['Lubricante', 370],
      ['Cantidad total (gal)', 200], ['Tarea', 180], ['Intervalo de cambio de aceite', 280], ['Método', 190], ['Intervalo de muestreo (h)', 290],
    ];
    if (conNivel) {
      cols.push(['Revisión de nivel', 290]);
      const tot = cols.reduce((a, x) => a + x[1], 0);
      cols = cols.map(([t, w], i) => [t, i === 0 ? w : Math.floor(w * (CW - 130) / (tot - 130))]);
    }
    L.fuente(28, 700); L.texto('PUNTOS DE CAMBIO DE ACEITE', PAD, y + 28, C.naranjaOsc);
    y += 50;
    // encabezado
    L.fuente(25, 700);
    const enc = cols.map(([t, w]) => envolver(c, t.toUpperCase(), w - 36));
    const hEnc = Math.max(...enc.map((l) => l.length)) * 32 + 44;
    L.rect(PAD, y, CW, hEnc, C.tinta, 0);
    if (!L.seco) { c.save(); rr(c, PAD, y, CW, hEnc + 10, 18); c.clip(); c.fillStyle = C.tinta; c.fillRect(PAD, y, CW, hEnc); c.restore(); }
    let x = PAD;
    enc.forEach((ls, i) => {
      L.fuente(25, 700);
      ls.forEach((l, k) => L.texto(l, x + 18, y + 22 + 25 + k * 32, '#FFFFFF'));
      x += cols[i][1];
    });
    y += hEnc;
    equipo.puntos.forEach((p, i) => {
      const celdas = [
        null,
        { t: p.componente || '—' },
        valor(p.codigoLIS), valor(p.lubricante), valor(p.cantidad, 'gal'), valor(p.tarea),
        valor(p.intervaloCambio), valor(p.metodo), valor(p.intervaloMuestreo, 'h'),
        ...(conNivel ? [vacio(p.revisionNivel) ? { t: '—', vacio: true } : valor(p.revisionNivel)] : []),
      ];
      const lineas = celdas.map((cel, k) => {
        if (!cel) return [];
        L.fuente(29, k === 1 ? 700 : 500, F.txt, cel.vacio);
        return envolver(c, cel.t, cols[k][1] - 36);
      });
      const li = lisImgs[i];
      const h = Math.max(96, Math.max(...lineas.map((l, k) => l.length + (k === 2 && li ? 1 : 0))) * 38 + 44);
      L.rect(PAD, y, CW, h, i % 2 ? C.fondo : '#FFFFFF');
      L.rect(PAD, y + h - 2, CW, 2, C.linea);
      // número
      if (!L.seco) {
        c.beginPath(); c.arc(PAD + 62, y + h / 2, 30, 0, Math.PI * 2); c.fillStyle = C.naranja; c.fill();
      }
      L.fuente(32, 800, F.dsp); L.texto(String(i + 1), PAD + 62, y + h / 2 + 11, C.tinta, 'center');
      let cx = PAD + cols[0][1];
      lineas.forEach((ls, k) => {
        if (k === 0) return;
        const cel = celdas[k];
        L.fuente(29, k === 1 ? 700 : 500, F.txt, cel.vacio);
        const conImg = k === 2 && li;
        const top = y + (h - (ls.length + (conImg ? 1 : 0)) * 38) / 2 - 6;
        if (conImg) L.img(li, cx + 18, top + 6, 96, 30);
        const desf = conImg ? 38 : 0;
        ls.forEach((l, j) => L.texto(l, cx + 18, top + desf + 29 + j * 38, cel.vacio ? C.tinta3 : C.tinta));
        cx += cols[k][1];
      });
      y += h;
    });
    L.rect(PAD, y - 2, CW, 2, C.tinta2);
    y += 70;

    // ---- Seguridad
    L.fuente(28, 700); L.texto('SEGURIDAD', PAD, y + 28, C.naranjaOsc);
    y += 50;
    // advertencia
    L.fuente(30, 500);
    const advL = envolver(c, equipo.advertencia || '', CW - 80);
    const hAdv = 40 + 44 + advL.length * 42 + 30;
    L.rect(PAD, y, CW, hAdv, C.ambarFondo, 20, C.ambarBorde, 3);
    L.fuente(30, 800); L.texto('ADVERTENCIA', PAD + 40, y + 40 + 30, C.ambarTinta);
    L.fuente(30, 500);
    advL.forEach((l, i) => L.texto(l, PAD + 40, y + 40 + 44 + 30 + i * 42, C.ambarTinta));
    y += hAdv + 30;
    // primeros auxilios + incendios
    const paW = 1420, inW = CW - paW - 30;
    const pa = equipo.primerosAuxilios || {};
    const items = [['Ojos', pa.ojos], ['Piel', pa.piel], ['Ingestión', pa.ingestion], ['Inhalación', pa.inhalacion]];
    const subW = (paW - 80 - 40) / 2;
    const alt = items.map(([, t]) => { L.fuente(27, 500); return envolver(c, t || '—', subW).length * 37; });
    const fila1 = Math.max(alt[0], alt[1]), fila2 = Math.max(alt[2], alt[3]);
    L.fuente(26, 500, F.txt, true);
    const notaL = pa.nota ? envolver(c, pa.nota, paW - 80) : [];
    const hPA = 40 + 40 + 30 + (40 + fila1) + 26 + (40 + fila2) + (notaL.length ? 30 + notaL.length * 36 : 0) + 40;
    L.fuente(28, 500);
    const incL = envolver(c, equipo.incendios || '—', inW - 80);
    const hIn = 40 + 40 + 30 + incL.length * 40 + 40;
    const hSeg = Math.max(hPA, hIn);
    L.rect(PAD, y, paW, hSeg, '#FFFFFF', 20, C.linea, 3);
    L.fuente(30, 800); L.texto('PRIMEROS AUXILIOS PARA LUBRICADORES', PAD + 40, y + 70, C.tinta);
    let py = y + 40 + 40 + 30;
    items.forEach(([k, t], i) => {
      const col = i % 2, fx = PAD + 40 + col * (subW + 40);
      const fy = py + (i >= 2 ? 40 + fila1 + 26 : 0);
      L.fuente(27, 700); L.texto(k, fx, fy + 27, C.naranjaOsc);
      L.parrafo(t || '—', fx, fy + 36, subW, 27, 500, C.tinta2, 1.37);
    });
    py += 40 + fila1 + 26 + 40 + fila2;
    if (notaL.length) {
      L.fuente(26, 500, F.txt, true);
      notaL.forEach((l, i) => L.texto(l, PAD + 40, py + 30 + 26 + i * 36, C.tinta2));
    }
    const ix = PAD + paW + 30;
    L.rect(ix, y, inW, hSeg, C.rojoFondo, 20, C.rojoBorde, 3);
    L.fuente(30, 800); L.texto('MEDIDA CONTRA INCENDIOS', ix + 40, y + 70, C.rojoTinta);
    L.fuente(28, 500);
    incL.forEach((l, i) => L.texto(l, ix + 40, y + 110 + 28 + i * 40, C.rojoTinta));
    y += hSeg + 60;

    // ---- Pie
    L.rect(PAD, y, CW, 2, C.linea);
    y += 56;
    L.fuente(30, 700); L.texto(equipo.departamento || 'Departamento de Tribología', PAD, y, C.tinta);
    L.fuente(24, 500);
    L.texto(`Generada el ${fechaCorta(new Date().toISOString())} · ${url.replace(/^https?:\/\//, '')}`, W - PAD, y, C.tinta3, 'right');
    return y + 60;
  };

  let H = dibujar(new Lienzo(medir, true));
  // Límite de memoria de canvas en iPhone (~16,7 MP): reducir escala si hace falta
  const escala = Math.min(1, Math.sqrt(16000000 / (W * H)));
  const cv = crearCanvas(Math.floor(W * escala), Math.floor(H * escala));
  const ctx = cv.getContext('2d');
  ctx.scale(escala, escala);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  dibujar(new Lienzo(ctx, false));
  return aBlob(cv);
}
