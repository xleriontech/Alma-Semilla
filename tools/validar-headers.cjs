/* ==================================================================
   Validador de _headers y _redirects
   --------------------------------------------------------------
   Cloudflare NO admite comentarios en estos archivos: cualquier línea
   que no sea un patrón de ruta o un par "Cabecera: valor" aborta el
   despliegue con "Expected a colon-separated header pair".

   Se ejecuta dentro de build.js para fallar rápido y en local.
   ================================================================== */

function validarHeaders(contenido, nombre) {
  const errores = [];
  const lineas = contenido.split('\n');
  let enBloque = false;

  lineas.forEach((linea, i) => {
    const n = i + 1;

    // Un \r suelto (CRLF) rompe el parser de Cloudflare
    if (/\r$/.test(linea)) {
      errores.push('L' + n + ': salto de línea CRLF (usa solo LF)');
    }

    if (linea.trim() === '') { enBloque = false; return; }

    // Una ruta inicia un bloque
    if (!/^\s/.test(linea)) {
      if (!/^\//.test(linea)) {
        errores.push('L' + n + ': se esperaba una ruta que empiece por "/" → ' + JSON.stringify(linea.slice(0, 60)));
      }
      enBloque = true;
      return;
    }

    const sinEspacios = linea.trim();

    // Dentro de un bloque: "Cabecera: valor"
    if (sinEspacios.indexOf(':') === -1) {
      errores.push('L' + n + ': se esperaba un par "Cabecera: valor" → ' + JSON.stringify(sinEspacios.slice(0, 60)));
      return;
    }
    if (!enBloque) {
      errores.push('L' + n + ': cabecera fuera de cualquier bloque de ruta');
    }
    const nombreCabecera = sinEspacios.split(':')[0].trim();
    if (!/^[A-Za-z0-9-]+$/.test(nombreCabecera)) {
      errores.push('L' + n + ': nombre de cabecera inválido → ' + JSON.stringify(nombreCabecera));
    }
  });

  return errores.map((e) => nombre + ': ' + e);
}

module.exports = { validarHeaders };
