/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · build.js
   Prepara la carpeta dist/ que se despliega en Cloudflare Pages.

   Uso:  node build.js
   Salida: dist/  (contenido estático listo para publicar)

   No requiere dependencias: solo Node >= 16.
   ================================================================== */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { validarHeaders } = require('./tools/validar-headers.cjs');

const RAIZ = __dirname;
const DESTINO = path.join(RAIZ, 'dist');

// --- Versionado de assets por hash del contenido ---
// Al construir, las URLs de CSS/JS se reescriben con el hash real del archivo.
// Así, cualquier cambio en el CSS o el JS genera una URL nueva y ningún
// navegador sirve una versión obsoleta desde su caché.
const ASSETS_VERSIONADOS = [
  'assets/css/styles.css',
  'assets/js/main.js',
  'assets/js/tejido.js'
];

function hashArchivo(relativo) {
  const ruta = path.join(RAIZ, relativo);
  if (!fs.existsSync(ruta)) return null;
  return crypto.createHash('sha1')
    .update(fs.readFileSync(ruta))
    .digest('hex')
    .slice(0, 8);
}

function versiones() {
  const mapa = {};
  for (const asset of ASSETS_VERSIONADOS) {
    const h = hashArchivo(asset);
    if (h) mapa[asset] = h;
  }
  return mapa;
}

function actualizarVersiones(html, mapa) {
  let salida = html;
  for (const asset of Object.keys(mapa)) {
    const base = asset.split('/').pop();
    // Sustituye cualquier ?v= existente por el hash vigente
    const re = new RegExp('(' + base.replace(/\./g, '\\.') + ')\\?v=[a-z0-9]+', 'g');
    salida = salida.replace(re, '$1?v=' + mapa[asset]);
  }
  return salida;
}

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

function copiarPagina(origen, destino, mapa) {
  const html = fs.readFileSync(origen, 'utf8');
  fs.writeFileSync(destino, actualizarVersiones(html, mapa), 'utf8');
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
  // --- Validación previa de los archivos de Cloudflare ---
  // Si _headers o _redirects tienen un formato inválido, el despliegue
  // falla en la API de Cloudflare. Se comprueba aquí para no llegar hasta allí.
  const problemas = [];
  for (const archivo of ['_headers', '_redirects']) {
    const ruta = path.join(RAIZ, archivo);
    if (!fs.existsSync(ruta)) continue;
    problemas.push.apply(problemas, validarHeaders(fs.readFileSync(ruta, 'utf8'), archivo));
  }
  if (problemas.length) {
    console.error('\nERROR: formato inválido en los archivos de Cloudflare:\n');
    problemas.forEach((p) => console.error('  ' + p));
    console.error('\nCloudflare no admite comentarios en _headers/_redirects:');
    console.error('solo líneas de ruta ("/ruta") y pares "Cabecera: valor".\n');
    process.exit(1);
  }

  // Limpieza
  if (fs.existsSync(DESTINO)) fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO, { recursive: true });

  let copiados = 0;
  const mapa = versiones();

  for (const pagina of PAGINAS) {
    const origen = path.join(RAIZ, pagina);
    if (!fs.existsSync(origen)) {
      console.warn('  ! falta ' + pagina + ' — se omite');
      continue;
    }
    copiarPagina(origen, path.join(DESTINO, pagina), mapa);
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
  console.log('Versiones de assets:');
  for (const asset of Object.keys(mapa)) {
    console.log('  ' + asset + '?v=' + mapa[asset]);
  }
  console.log('Despliegue en Cloudflare Pages → directorio de salida: dist');
}

main();
