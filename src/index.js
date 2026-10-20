/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · Worker
   ------------------------------------------------------------------
   Sirve el sitio estático desde dist/ mediante el binding ASSETS
   (Workers Static Assets). El archivo _headers que genera build.js
   se aplica automáticamente: CSP, HSTS y política de caché.
   ================================================================== */

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
