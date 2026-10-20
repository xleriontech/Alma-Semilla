/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · build.js
   Prepara la carpeta dist/ que se despliega en Cloudflare Pages.

   Uso:  node build.js
   Salida: dist/  (contenido estático listo para publicar)

   No requiere dependencias: solo Node >= 16.
   ================================================================== */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const DESTINO = path.join(RAIZ, 'dist');

// Páginas que se publican
const PAGINAS = [
  'index.html',
  'objeto-social.html',
  'repositorio.html',
  'transparencia.html',
  'contacto.html',
  '404.html'
];

// Archivos sueltos en la raíz
const ARCHIVOS = [
  '_headers',
  'robots.txt',
  'sitemap.xml'
];

// Carpetas que se copian completas
const CARPETAS = ['assets'];

// Se excluyen del despliegue (herramientas y material de trabajo)
const EXCLUIDOS = ['site_examples', 'node_modules', 'dist', '.git'];

function copiarArchivo(origen, destino) {
  const dir = path.dirname(destino);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(origen, destino);
}

function copiarCarpeta(origen, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    if (EXCLUIDOS.indexOf(entrada.name) !== -1) continue;
    const src = path.join(origen, entrada.name);
    const dst = path.join(destino, entrada.name);
    if (entrada.isDirectory()) copiarCarpeta(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function contar(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += contar(path.join(dir, e.name));
    else n++;
  }
  return n;
}

function main() {
  // Limpieza
  if (fs.existsSync(DESTINO)) fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO, { recursive: true });

  let copiados = 0;

  for (const pagina of PAGINAS) {
    const origen = path.join(RAIZ, pagina);
    if (!fs.existsSync(origen)) {
      console.warn('  ! falta ' + pagina + ' — se omite');
      continue;
    }
    copiarArchivo(origen, path.join(DESTINO, pagina));
    copiados++;
  }

  for (const archivo of ARCHIVOS) {
    const origen = path.join(RAIZ, archivo);
    if (!fs.existsSync(origen)) {
      console.warn('  ! falta ' + archivo + ' — se omite');
      continue;
    }
    copiarArchivo(origen, path.join(DESTINO, archivo));
    copiados++;
  }

  for (const carpeta of CARPETAS) {
    const origen = path.join(RAIZ, carpeta);
    if (!fs.existsSync(origen)) continue;
    copiarCarpeta(origen, path.join(DESTINO, carpeta));
  }

  const total = contar(DESTINO);
  console.log('Build completado: dist/ con ' + total + ' archivos (' + copiados + ' en la raíz).');
  console.log('Despliegue en Cloudflare Pages → directorio de salida: dist');
}

main();
