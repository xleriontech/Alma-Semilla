/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · main.js
   Comportamiento compartido por todas las páginas
   ------------------------------------------------------------------
   1. Utilidades
   2. Navegación (sombra + menú móvil)
   3. Aparición al hacer scroll
   4. Contadores de cifras
   5. Formularios
   6. Botón "volver arriba"
   7. Año en el pie de página
   ================================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     1. UTILIDADES
     ----------------------------------------------------------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* -----------------------------------------------------------
     2. NAVEGACIÓN
     ----------------------------------------------------------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const links = $('#links');

  function alDesplazar() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  if (burger && links) {
    const alternar = (abrir) => {
      links.classList.toggle('is-abierto', abrir);
      burger.setAttribute('aria-expanded', String(abrir));
      burger.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
      // La clase va en <html> para bloquear el scroll sin romper el sticky de la nav
      document.documentElement.classList.toggle('menu-abierto', abrir);
    };

    burger.addEventListener('click', () => {
      alternar(!links.classList.contains('is-abierto'));
    });

    $$('a', links).forEach((a) => a.addEventListener('click', () => alternar(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('is-abierto')) {
        alternar(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && links.classList.contains('is-abierto')) alternar(false);
    });
  }

  /* -----------------------------------------------------------
     3. APARICIÓN AL HACER SCROLL
     ----------------------------------------------------------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('ha-entrado');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('ha-entrado'));
  }

  /* -----------------------------------------------------------
     4. CONTADORES DE CIFRAS
     ----------------------------------------------------------- */
  function animarContador(el) {
    const fin = Number(el.dataset.n) || 0;
    const duracion = 1700;
    const t0 = performance.now();

    function paso(t) {
      const p = Math.min((t - t0) / duracion, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const valor = Math.round(fin * eased);
      el.textContent = valor.toLocaleString('es-CO') + (fin >= 1000 ? '+' : '');
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if ('IntersectionObserver' in window) {
    const obsCifras = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        animarContador(e.target);
        obsCifras.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    $$('.cifra b[data-n]').forEach((el) => obsCifras.observe(el));
  } else {
    $$('.cifra b[data-n]').forEach((el) => {
      const n = Number(el.dataset.n);
      el.textContent = n.toLocaleString('es-CO') + (n >= 1000 ? '+' : '');
    });
  }

  /* -----------------------------------------------------------
     4b. IMÁGENES CON FALLBACK
     Si una imagen no carga, se retira para no dejar un hueco roto.
     Se hace con listener (y no con onerror inline) para poder
     mantener una CSP estricta sin 'unsafe-inline'.
     ----------------------------------------------------------- */
  $$('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    });
  });

  /* -----------------------------------------------------------
     5. FORMULARIOS
     ----------------------------------------------------------- */
  function validarCorreo(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  const formContacto = $('#form-contacto');
  const avisoForm = $('#form-aviso');

  if (formContacto && avisoForm) {
    formContacto.addEventListener('submit', (e) => {
      e.preventDefault();

      const nombre = $('#nombre').value.trim();
      const correo = $('#correo').value.trim();
      const mensaje = $('#mensaje').value.trim();
      const acepta = $('#habeo').checked;

      if (!nombre || !validarCorreo(correo) || !mensaje || !acepta) {
        avisoForm.textContent = 'Revisa el formulario: nombre, correo válido, mensaje y aceptación de la política de datos son obligatorios.';
        avisoForm.classList.add('es-error');
        avisoForm.hidden = false;
        return;
      }

      avisoForm.textContent = '¡Gracias, ' + nombre + '! Hemos recibido tu mensaje y te responderemos a la brevedad.';
      avisoForm.classList.remove('es-error');
      avisoForm.hidden = false;
      formContacto.reset();
    });
  }

  const formBoletin = $('#form-boletin');
  const avisoBoletin = $('#boletin-aviso');

  if (formBoletin && avisoBoletin) {
    formBoletin.addEventListener('submit', (e) => {
      e.preventDefault();
      const correo = $('#boletin-correo').value.trim();

      if (!validarCorreo(correo)) {
        avisoBoletin.textContent = 'Escribe un correo electrónico válido.';
        avisoBoletin.classList.add('es-error');
        avisoBoletin.hidden = false;
        return;
      }

      avisoBoletin.textContent = '¡Listo! Te escribiremos con las próximas novedades.';
      avisoBoletin.classList.remove('es-error');
      avisoBoletin.hidden = false;
      formBoletin.reset();
    });
  }

  /* -----------------------------------------------------------
     6. BOTÓN "VOLVER ARRIBA"
     ----------------------------------------------------------- */
  const btnSubir = $('#subir');

  if (btnSubir) {
    const alternarSubir = () => {
      btnSubir.hidden = false;
      btnSubir.classList.toggle('esta-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', alternarSubir, { passive: true });
    alternarSubir();
    btnSubir.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* -----------------------------------------------------------
     7. AÑO EN EL PIE DE PÁGINA
     ----------------------------------------------------------- */
  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

})();
