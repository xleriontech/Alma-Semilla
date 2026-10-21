/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · main.js
   Comportamiento compartido por todas las páginas
   ------------------------------------------------------------------
   1. Utilidades
   2. Navegación (sombra + menú móvil)
   3. Cargador: la planta que crece
   4. Aparición al hacer scroll
   5. Contadores de cifras
   6. Transiciones entre secciones y scroll spy
   7. Barra de progreso de lectura
   8. Imágenes con respaldo
   9. Formularios
  10. Botón "volver arriba"
  11. Año en el pie de página
   ================================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     1. UTILIDADES
     ----------------------------------------------------------- */
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const respalda = (sel) => (sel ? sel.querySelectorAll(sel) : []);

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
     3. CARGADOR · LA PLANTA QUE CRECE
     El crecimiento va ligado al progreso real de la carga: cada
     variable CSS se calcula a partir de un único valor --c.
     ----------------------------------------------------------- */
  function iniciarCargador() {
    const preloader = $('#preloader');
    if (!preloader) return;

    const barra = $('#preloader-barra');
    const pct = $('#preloader-pct');

    let progreso = 0;
    let descargado = false;
    let terminado = false;

    // Recorta el progreso entre dos tramos: (c - a) / (b - a) acotado a 0..1
    const tramo = (c, a, b) => Math.max(0, Math.min(1, (c - a) / (b - a)));

    function pintar() {
      preloader.style.setProperty('--c', progreso.toFixed(4));
      preloader.style.setProperty('--suelo', tramo(progreso, 0, 0.10).toFixed(4));
      preloader.style.setProperty('--brote', tramo(progreso, 0.03, 0.14).toFixed(4));
      preloader.style.setProperty('--tallo', tramo(progreso, 0.10, 0.62).toFixed(4));
      preloader.style.setProperty('--raiz', tramo(progreso, 0.04, 0.34).toFixed(4));
      preloader.style.setProperty('--hojaI', tramo(progreso, 0.44, 0.70).toFixed(4));
      preloader.style.setProperty('--hojaD', tramo(progreso, 0.54, 0.80).toFixed(4));
      preloader.style.setProperty('--flor', tramo(progreso, 0.70, 0.94).toFixed(4));
      preloader.style.setProperty('--semilla', tramo(progreso, 0.86, 1).toFixed(4));
      if (barra) barra.style.width = (progreso * 100).toFixed(1) + '%';
      if (pct) pct.textContent = Math.round(progreso * 100) + ' %';
    }

    // Avance asintótico: la planta crece mientras se descarga la página
    const inicio = performance.now();
    function tic() {
      if (descargado || terminado) return;
      const t = (performance.now() - inicio) / 1000;
      const virtual = 0.92 * (1 - Math.exp(-t * 1.15));
      if (virtual > progreso) { progreso = virtual; pintar(); }
      requestAnimationFrame(tic);
    }
    requestAnimationFrame(tic);

    function finalizar() {
      if (terminado) return;
      terminado = true;
      progreso = 1;
      pintar();

      // Margen para que la planta termine de abrirse
      const espera = reducirMovimiento ? 120 : 700;
      window.setTimeout(() => {
        preloader.classList.add('is-listo');
        document.body.classList.add('sitio-listo');
        window.setTimeout(() => {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 800);
      }, espera);
    }

    if (document.readyState === 'complete') {
      window.setTimeout(finalizar, 650);
    } else {
      // El evento load puede retrasarse (o no llegar) si un recurso
      // externo falla, por ejemplo sin conexión. No esperamos sin límite.
      window.addEventListener('load', () => window.setTimeout(finalizar, 250));
      window.setTimeout(finalizar, 3500);
    }

    // Red de seguridad: el cargador nunca bloquea el sitio
    window.setTimeout(finalizar, 5000);
  }

  iniciarCargador();

  /* -----------------------------------------------------------
     4. APARICIÓN AL HACER SCROLL
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
     5. CONTADORES DE CIFRAS
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
     6. TRANSICIONES ENTRE SECCIONES
     ----------------------------------------------------------- */
  function iniciarTransiciones() {
    // --- Entrada progresiva de las secciones ---
    const secciones = $$('.transicion-seccion');
    if ('IntersectionObserver' in window && secciones.length) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('ha-entrado');
          obs.unobserve(e.target);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
      secciones.forEach((s) => obs.observe(s));
    } else {
      secciones.forEach((s) => s.classList.add('ha-entrado'));
    }

    // --- Enlaces del menú que apuntan a un ancla de esta misma página ---
    const paginaActual = location.pathname.split('/').pop() || 'index.html';
    const enlaces = $$('.nav__links a[href*="#"]');

    const pares = enlaces
      .map((a) => {
        const href = a.getAttribute('href') || '';
        const id = href.split('#')[1];
        if (!id) return null;
        const pagina = href.split('#')[0];
        // Solo los que apuntan a esta misma página
        if (pagina && pagina !== paginaActual) return null;
        const destino = document.getElementById(id);
        return destino ? { enlace: a, destino: destino } : null;
      })
      .filter(Boolean);

    // --- Clic: desplazamiento suave + destello + foco accesible ---
    pares.forEach(({ enlace, destino }) => {
      enlace.addEventListener('click', (ev) => {
        ev.preventDefault();

        $$('.nav__links a').forEach((x) => x.classList.remove('pulsado'));
        enlace.classList.add('pulsado');
        window.setTimeout(() => enlace.classList.remove('pulsado'), 1400);

        destino.scrollIntoView({
          behavior: reducirMovimiento ? 'auto' : 'smooth',
          block: 'start'
        });

        if (history.pushState) history.pushState(null, '', '#' + destino.id);

        // El foco viaja a la sección para que el teclado no se quede atrás
        destino.setAttribute('tabindex', '-1');
        window.setTimeout(() => {
          try { destino.focus({ preventScroll: true }); } catch (e) { destino.focus(); }
        }, reducirMovimiento ? 0 : 700);

        // Destello visual en el borde superior de la sección
        destino.classList.remove('destacada');
        void destino.offsetWidth;
        destino.classList.add('destacada');
      });
    });

    // --- Scroll spy: marca la sección actual en el menú ---
    if ('IntersectionObserver' in window && pares.length) {
      const obsSpy = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          pares.forEach((p) => p.enlace.classList.remove('es-activo'));
          const par = pares.find((p) => p.destino === e.target);
          if (par) par.enlace.classList.add('es-activo');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      pares.forEach((p) => obsSpy.observe(p.destino));
    }
  }

  iniciarTransiciones();

  /* -----------------------------------------------------------
     7. BARRA DE PROGRESO DE LECTURA
     ----------------------------------------------------------- */
  const pista = $('#progreso-lectura');
  if (pista) {
    let pendiente = false;
    function pintarProgreso() {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const p = alto > 0 ? Math.min(1, Math.max(0, window.scrollY / alto)) : 0;
      pista.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      pendiente = false;
    }
    window.addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintarProgreso);
    }, { passive: true });
    window.addEventListener('resize', pintarProgreso);
    pintarProgreso();
  }

  /* -----------------------------------------------------------
     8. IMÁGENES CON RESPALDO
     Si una imagen no carga, el contenedor muestra su texto
     alternativo en lugar de dejar un hueco roto en silencio.
     Se hace con listener (y no con onerror inline) para poder
     mantener una CSP estricta sin 'unsafe-inline', y además se
     revisa `complete` por si la imagen ya falló antes de que este
     script se ejecutara (error perdido durante el parseo).
     ----------------------------------------------------------- */
  function respaldarImagen(img) {
    const cont = img.parentNode;
    if (!cont || cont.classList.contains('sin-imagen')) return;
    if (img.alt) cont.setAttribute('data-fallo', img.alt);
    cont.classList.add('sin-imagen');
    img.remove();
  }

  $$('img').forEach((img) => {
    img.addEventListener('error', () => respaldarImagen(img));
    if (img.complete && img.naturalWidth === 0) respaldarImagen(img);
  });

  /* -----------------------------------------------------------
     9. CALCULADORA DE IMPACTO
     ----------------------------------------------------------- */
  const sliderImpacto = $('#impacto-slider');
  const montoImpacto = $('#impacto-monto');

  function actualizarImpacto() {
    if (!sliderImpacto) return;
    const val = Number(sliderImpacto.value);

    // Relleno visual del control
    const pct = ((val - Number(sliderImpacto.min)) /
      (Number(sliderImpacto.max) - Number(sliderImpacto.min))) * 100;
    sliderImpacto.style.setProperty('--pct', pct + '%');

    if (montoImpacto) montoImpacto.textContent = '$' + val.toLocaleString('es-CO');

    const sensores = Math.max(1, Math.floor(val / 250000));
    const mujeres = Math.max(1, Math.floor(val / 100000));
    const arboles = Math.max(5, Math.floor(val / 20000));
    const huertas = Math.max(1, Math.floor(val / 125000));

    const set = (id, n, singular, plural) => {
      const el = $(id);
      if (el) el.textContent = n + ' ' + (n === 1 ? singular : plural);
    };
    set('#imp-sensores', sensores, 'Kit', 'Kits');
    set('#imp-mujeres', mujeres, 'Mujer', 'Mujeres');
    set('#imp-arboles', arboles, 'Árbol', 'Árboles');
    set('#imp-huertas', huertas, 'Huerta', 'Huertas');

    // Resalta el atajo activo
    $$('.atajo').forEach((b) => {
      b.classList.toggle('is-activo', Number(b.dataset.monto) === val);
    });
  }

  if (sliderImpacto) {
    sliderImpacto.addEventListener('input', actualizarImpacto);
    actualizarImpacto();
  }

  $$('.atajo').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!sliderImpacto) return;
      sliderImpacto.value = btn.dataset.monto;
      actualizarImpacto();
    });
  });

  /* -----------------------------------------------------------
     10. FORMULARIOS
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
     11. BOTÓN "VOLVER ARRIBA"
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
     12. PWA · REGISTRO DEL SERVICE WORKER
     Solo en producción: en file:// no hay service worker y en
     desarrollo estorba la caché del navegador.
     ----------------------------------------------------------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registro) => {
          // Pedir que la versión nueva se active de inmediato
          registro.addEventListener('updatefound', () => {
            const nuevo = registro.installing;
            if (!nuevo) return;
            nuevo.addEventListener('statechange', () => {
              if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
                document.documentElement.classList.add('hay-actualizacion');
              }
            });
          });
        })
        .catch(() => { /* sin service worker el sitio sigue funcionando */ });
    });
  }

  /* -----------------------------------------------------------
     13. PWA · BOTÓN DE INSTALACIÓN
     Solo aparece si el navegador ofrece instalarlo (Chrome, Edge,
     Android). En iOS se muestra una instrucción breve.
     ----------------------------------------------------------- */
  const btnInstalar = $('#btn-instalar');
  let promptInstalacion = null;

  if (btnInstalar) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      promptInstalacion = e;
      btnInstalar.hidden = false;
    });

    btnInstalar.addEventListener('click', async () => {
      if (promptInstalacion) {
        promptInstalacion.prompt();
        const eleccion = await promptInstalacion.userChoice;
        if (eleccion && eleccion.outcome === 'accepted') {
          btnInstalar.hidden = true;
        }
        promptInstalacion = null;
        return;
      }
      // iOS no expone beforeinstallprompt: se explica el procedimiento
      const ayuda = $('#ayuda-instalar');
      if (ayuda) ayuda.hidden = false;
      btnInstalar.hidden = true;
    });

    // Si ya está instalada, el botón no aporta nada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      btnInstalar.hidden = true;
    }
  }

  /* -----------------------------------------------------------
     14. AÑO EN EL PIE DE PÁGINA
     ----------------------------------------------------------- */
  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

})();
