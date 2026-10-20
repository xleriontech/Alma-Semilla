/* ==================================================================
   Auditor de contraste WCAG
   ------------------------------------------------------------------
   Recorre todas las páginas, calcula el color de fondo efectivo de
   cada texto (incluidos degradados) y comprueba el ratio frente al
   mínimo AA: 4,5:1 para texto normal y 3:1 para texto grande.

   Uso:
     npm i -D playwright
     npx playwright install chromium
     node tools/auditar-contraste.mjs

   No forma parte del despliegue: Playwright NO está en package.json
   para no ralentizar la compilación en Cloudflare.
   ================================================================== */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGINAS = [
  'index.html',
  'objeto-social.html',
  'repositorio.html',
  'transparencia.html',
  'contacto.html'
];

const AUDITOR = () => {
  function aLuz(c) {
    const q = c.match(/[\d.]+/g);
    if (!q) return null;
    return { r: +q[0], g: +q[1], b: +q[2], a: q[3] === undefined ? 1 : +q[3] };
  }
  function lum(c) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  // Fondo efectivo: sube por los ancestros hasta un color opaco
  // o el primer color de un degradado.
  function fondoDe(el) {
    let act = el;
    while (act && act !== document.documentElement) {
      const cs = getComputedStyle(act);
      const c = aLuz(cs.backgroundColor);
      if (c && c.a > 0.85) return c;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const par = cs.backgroundImage.match(/rgba?\([^)]+\)/g);
        if (par && par.length) { const q = aLuz(par[0]); if (q) return q; }
      }
      act = act.parentElement;
    }
    return { r: 250, g: 246, b: 238, a: 1 };
  }

  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const txt = el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!txt) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.6) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;

    const fg = aLuz(cs.color);
    if (!fg) return;
    const bg = fondoDe(el);
    const eff = fg.a < 1
      ? { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }
      : fg;
    const cr = ratio(eff, bg);

    const tam = parseFloat(cs.fontSize);
    const grande = tam >= 24 || (tam >= 18.66 && +cs.fontWeight >= 700);
    const minimo = grande ? 3 : 4.5;

    if (cr < minimo) {
      out.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''),
        texto: txt.slice(0, 46),
        color: cs.color,
        ratio: +cr.toFixed(2),
        minimo: minimo
      });
    }
  });
  return out;
};

const navegador = await chromium.launch({ headless: true });
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

let total = 0;
const vistos = new Map();

for (const archivo of PAGINAS) {
  await pagina.goto('file:///' + join(RAIZ, archivo).replace(/\\/g, '/'));
  await pagina.waitForTimeout(2500);
  const problemas = await pagina.evaluate(AUDITOR);
  for (const p of problemas) {
    const clave = archivo + '|' + p.sel + '|' + p.color;
    if (!vistos.has(clave)) vistos.set(clave, Object.assign({ pagina: archivo }, p));
  }
  total += problemas.length;
}

await navegador.close();

const lista = [...vistos.values()];
if (!lista.length) {
  console.log('✓ Contraste correcto: ningún texto baja del mínimo AA en las ' + PAGINAS.length + ' páginas.');
} else {
  console.log('✗ ' + total + ' incumplimiento(es), ' + lista.length + ' únicas:\n');
  lista.forEach((p) => {
    console.log('  ' + p.pagina.padEnd(20) + p.sel.padEnd(26) +
      p.ratio + '/' + p.minimo + '  "' + p.texto + '"');
  });
  process.exitCode = 1;
}
