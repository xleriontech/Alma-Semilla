/* ==================================================================
   FUNDACIÓN ALMA Y SEMILLA · tejido.js
   Módulos gráficos e interactivos del "Tejido Digital"
   ------------------------------------------------------------------
   1. Utilidades gráficas (PRNG determinista, canvas HiDPI)
   2. Corpus de saberes (metadatos de gobernanza)
   3. Hero: patrón étnico que se disuelve en nodos de red
   4. Repositorio: grafo interactivo de nodos de conocimiento
   5. Asistente Etnográfico (demo RAG con filtrado por nivel_acceso)
   ================================================================== */

document.documentElement.setAttribute('data-build', 'B8');

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     1. UTILIDADES GRÁFICAS
     ----------------------------------------------------------- */
  function prng(semilla) {
    let a = semilla >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function prepararCanvas(canvas, alRedimensionar) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let anchoPrevio = 0;
    let altoPrevio = 0;

    // Recalcula el bitmap del canvas. Sin esto, si el contenedor cambia
    // de alto (por ejemplo al crecer el panel de detalle), el CSS
    // estira el dibujo y el grafo se deforma.
    function medir() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      if (Math.abs(rect.width - anchoPrevio) < 0.5 && Math.abs(rect.height - altoPrevio) < 0.5) return false;
      anchoPrevio = rect.width;
      altoPrevio = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    medir();
    window.addEventListener('resize', function () {
      if (medir() && alRedimensionar) alRedimensionar();
    });

    if (alRedimensionar && 'ResizeObserver' in window) {
      const observador = new ResizeObserver(function () {
        if (medir()) alRedimensionar();
      });
      observador.observe(canvas);
    }

    return {
      ctx: ctx,
      ancho: function () { return canvas.getBoundingClientRect().width; },
      alto: function () { return canvas.getBoundingClientRect().height; }
    };
  }

  function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* -----------------------------------------------------------
     2. CORPUS DE SABERES
     Metadatos de gobernanza: nivel_acceso, comunidad, territorio,
     cpli y estado de vectorización.
     ----------------------------------------------------------- */
  const NIVELES = {
    publico:     { etiqueta: 'Público',     color: '#10b981' },
    restringido: { etiqueta: 'Restringido', color: '#e9b44c' },
    sagrado:     { etiqueta: 'Sagrado',     color: '#a855f7' }
  };

  const CORPUS = [
    {
      id: 'ETN-001', titulo: 'Cerramiento cyclical de la huerta familiar',
      tipo: 'Etnociencia', comunidad: 'Sabedores de Vereda Fonquetá',
      territorio: 'Chía, Cundinamarca', anio: 2019, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Rotación de cultivos y descanso de parcelas bajo calendario lunar, con registro de variaciones de humedad del suelo.',
      coords: [4.868, -74.132]
    },
    {
      id: 'ETN-014', titulo: 'Soberanía alimentaria: manejo del agua de páramo',
      tipo: 'Etnociencia', comunidad: 'Consejo Comunitario de la Cuenca Alta',
      territorio: 'Caquetá', anio: 2021, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Infraestructura de acequias, rondas de agua y acuerdos de distribución; base para el monitoreo IoT en la cuenca.',
      coords: [1.6, -74.8]
    },
    {
      id: 'ETN-027', titulo: 'Cultivos ancestrales de páramo y su conservación',
      tipo: 'Etnociencia', comunidad: 'Red de Productores de Pasto',
      territorio: 'Nariño', anio: 2022, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Catálogo de tubérculos, frijoles y plantas medicinales del páramo con prácticas de conservación ex situ.',
      coords: [1.2, -77.6]
    },
    {
      id: 'ETN-033', titulo: 'Kraupé: etnobotánica de la Mikania cordata',
      tipo: 'Medicina Tradicional', comunidad: 'Auxiliares de Salud wayuu',
      territorio: 'La Guajira', anio: 2020, nivel_acceso: 'restringido',
      cpli: true, vectorizado: true,
      resumen: 'Uso, preparación y dosificación de la Mikania cordata en la remedy de La Guajira, con protocolo de uso restringido.',
      coords: [11.7, -72.2]
    },
    {
      id: 'ETN-041', titulo: 'Farmacopea del monte: catálogo de plantas cicatrizantes',
      tipo: 'Medicina Tradicional', comunidad: 'Sabedores del Valle del Cauca',
      territorio: 'Valle del Cauca', anio: 2021, nivel_acceso: 'restringido',
      cpli: true, vectorizado: true,
      resumen: 'Registro de especies, partes usadas, método de preparación e indicaciones terapéuticas en quebra de piel e infección.',
      coords: [3.4, -76.5]
    },
    {
      id: 'ETN-052', titulo: 'Protocolo ceremonial de la medicina ancestral',
      tipo: 'Medicina Tradicional', comunidad: 'Consejo de Sabedores Uwa',
      territorio: 'Sierra Nevada de Santa Marta', anio: 2023, nivel_acceso: 'sagrado',
      cpli: true, vectorizado: false,
      resumen: 'Secuencia ritual de preparación, invocación y transmisión. No incorporable a corpus público: requiere autorización específica.',
      coords: [11.2, -74.2]
    },
    {
      id: 'ETN-060', titulo: 'Ritual del agua: la challwa y sus prohibiciones',
      tipo: 'Filosofía y Cosmovisión', comunidad: 'Cuidadores de la Wachaka',
      territorio: 'Chía, Cundinamarca', anio: 2018, nivel_acceso: 'sagrado',
      cpli: true, vectorizado: false,
      resumen: 'Prácticas, prohibiciones y relatos asociados al agua como entidad viva. Conocimiento de acceso restringido por decisión de la comunidad.',
      coords: [4.86, -74.13]
    },
    {
      id: 'ETN-068', titulo: 'Narrativas orales: relatos de origen del territorio',
      tipo: 'Filosofía y Cosmovisión', comunidad: 'Consejo de Ancianos Embera',
      territorio: 'Chocó', anio: 2020, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Transcripción y análisis narrativo de relatos de origen, con geolocalización de los sitios mencionados.',
      coords: [5.7, -76.6]
    },
    {
      id: 'ETN-075', titulo: 'Patrones geométricos y código textil chaquira',
      tipo: 'Filosofía y Cosmovisión', comunidad: 'Tejedoras de Tuluá',
      territorio: 'Valle del Cauca', anio: 2022, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Documentación gráfica de motivos geométricos, su significado y su correspondencia con los trazos que estructuran nuestro patrón institucional.',
      coords: [4.1, -76.2]
    },
    {
      id: 'ETN-081', titulo: 'Topónimos y variantes léxicas regionales',
      tipo: 'Filosofía y Cosmovisión', comunidad: 'Grupo de Investigación Lingüística',
      territorio: 'Sabana de Bogotá', anio: 2021, nivel_acceso: 'restringido',
      cpli: true, vectorizado: true,
      resumen: 'Mapa de topónimos de origen prehispánico y variantes léxicas de uso local, con audios de referencia.',
      coords: [4.9, -74.1]
    },
    {
      id: 'ETN-090', titulo: 'Chagra: policultivo y calendarios agroecológicos',
      tipo: 'Etnociencia', comunidad: 'Agricultores de la Amazonía',
      territorio: 'Vaupés', anio: 2019, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Diseño de policultivo, manejo de zonas de siembra y calendarios de siembra, contrastados con datos de precipitación.',
      coords: [1.06, -70.3]
    },
    {
      id: 'ETN-102', titulo: 'Arbolado nativo de sombra para el café de altura',
      tipo: 'Etnociencia', comunidad: 'Familias productoras de Chía',
      territorio: 'Chía, Cundinamarca', anio: 2023, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Especies de sombra nativas, densidades recomendadas y su efecto sobre la humedad del suelo y el microclima del cafetal.',
      coords: [4.9, -74.15]
    },
    {
      id: 'ETN-115', titulo: 'Cartografía de los lugares de paso',
      tipo: 'Cooperación Internacional', comunidad: 'Mesas Territoriales',
      territorio: 'Boyacá', anio: 2022, nivel_acceso: 'restringido',
      cpli: true, vectorizado: true,
      resumen: 'Mapeo participativo de pasos, caminos y puntos de encuentro, en formato abierto para investigación aplicada.',
      coords: [5.7, -73.0]
    },
    {
      id: 'ETN-120', titulo: 'Pasantías de formación técnica en etnotecnología',
      tipo: 'Cooperación Internacional', comunidad: 'Aliados: MinTIC, MinCultura, UNAM',
      territorio: 'Nacional', anio: 2024, nivel_acceso: 'publico',
      cpli: true, vectorizado: true,
      resumen: 'Programa de formación de jóvenes rurales en construir sensores, RV y modelos de IA con enfoque diferencial y perspectiva de derechos.',
      coords: [4.71, -74.07]
    }
  ];

  /* -----------------------------------------------------------
     3. HERO · patrón étnico que se disuelve en nodos de red
     ----------------------------------------------------------- */
  function iniciarTejidoHero() {
    const canvas = $('#tejido-hero');
    if (!canvas) return;

    const lienzo = prepararCanvas(canvas, function () { render(0); });
    const ctx = lienzo.ctx;
    const aleatorio = prng(20260915);

    const nodos = [];
    for (let i = 0; i < 30; i++) {
      nodos.push({
        x: 0.34 + aleatorio() * 0.66,
        y: 0.08 + aleatorio() * 0.84,
        r: 1.6 + aleatorio() * 2.6,
        fase: aleatorio() * Math.PI * 2,
        vel: 0.4 + aleatorio() * 0.8
      });
    }

    const aristas = [];
    nodos.forEach(function (n, i) {
      const dist = nodos
        .map(function (m, j) { return { j: j, d: Math.hypot(n.x - m.x, n.y - m.y) }; })
        .filter(function (o) { return o.j !== i; })
        .sort(function (a, b) { return a.d - b.d; })
        .slice(0, 3);
      dist.forEach(function (o) {
        const yaExiste = aristas.some(function (e) {
          return (e.a === o.j && e.b === i) || (e.a === i && e.b === o.j);
        });
        if (!yaExiste) aristas.push({ a: i, b: o.j });
      });
    });

    const celda = 104;

    function dibujarPatron(W, H) {
      ctx.save();
      ctx.strokeStyle = 'rgba(233, 180, 76, 0.5)';
      ctx.lineWidth = 1.1;
      ctx.lineJoin = 'round';
      const filas = Math.ceil(H / celda) + 2;
      const cols = Math.ceil(W / celda) + 2;

      for (let f = -1; f < filas; f++) {
        for (let c = -1; c < cols; c++) {
          const cx = c * celda + (f % 2 ? celda / 2 : 0);
          const cy = f * celda;
          const a = limitar(1 - (cx / W - 0.08) / 0.55, 0, 1);
          if (a <= 0.01) continue;

          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.moveTo(cx, cy - celda * 0.46);
          ctx.lineTo(cx + celda * 0.46, cy);
          ctx.lineTo(cx, cy + celda * 0.46);
          ctx.lineTo(cx - celda * 0.46, cy);
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx, cy - celda * 0.26);
          ctx.lineTo(cx + celda * 0.26, cy);
          ctx.lineTo(cx, cy + celda * 0.26);
          ctx.lineTo(cx - celda * 0.26, cy);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function dibujarRed(W, H, t) {
      ctx.save();
      ctx.lineWidth = 1;
      aristas.forEach(function (e) {
        const a = nodos[e.a];
        const b = nodos[e.b];
        const alfa = limitar((a.x + b.x) / 2 - 0.28, 0, 1) * 0.42;
        if (alfa <= 0.02) return;
        ctx.strokeStyle = 'rgba(52, 211, 153, ' + alfa + ')';
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.stroke();
      });

      nodos.forEach(function (n) {
        const alfa = limitar(n.x - 0.28, 0, 1);
        if (alfa <= 0.02) return;
        const pulso = reducirMovimiento ? 1 : (0.75 + 0.25 * Math.sin(t * 0.0012 * n.vel + n.fase));
        ctx.fillStyle = 'rgba(52, 211, 153, ' + (0.75 * alfa * pulso) + ')';
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        ctx.fill();

        if (n.x > 0.42) {
          ctx.strokeStyle = 'rgba(233, 180, 76, ' + (0.16 * alfa) + ')';
          ctx.beginPath();
          ctx.moveTo(n.x * W - 60, n.y * H + 6);
          ctx.quadraticCurveTo(n.x * W - 24, n.y * H - 8, n.x * W, n.y * H);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    function render(t) {
      const W = lienzo.ancho();
      const H = lienzo.alto();
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      dibujarPatron(W, H);
      dibujarRed(W, H, t || 0);
    }

    if (reducirMovimiento) {
      render(0);
    } else {
      const bucle = function (t) { render(t); requestAnimationFrame(bucle); };
      requestAnimationFrame(bucle);
    }
  }

  /* -----------------------------------------------------------
     4. REPOSITORIO · grafo interactivo de knowledge nodes
     ----------------------------------------------------------- */
  function iniciarGrafoRepositorio() {
    const canvas = $('#tejido-grafo');
    if (!canvas) return;

    const lienzo = prepararCanvas(canvas, function () { dibujar(0); });
    const ctx = lienzo.ctx;
    const panel = $('#nodo-detalle');
    const aleatorio = prng(730411);

    const nodos = CORPUS.map(function (reg, i) {
      const ang = (i / CORPUS.length) * Math.PI * 2 + aleatorio() * 0.5;
      const rad = 0.20 + aleatorio() * 0.28;
      return {
        reg: reg,
        x: 0.5 + Math.cos(ang) * rad,
        y: 0.5 + Math.sin(ang) * rad * 1.15,
        r: 6 + (reg.tipo === 'Medicina Tradicional' ? 2 : 0),
        fase: aleatorio() * Math.PI * 2
      };
    });

    const aristas = [];
    nodos.forEach(function (n, i) {
      const vecinos = nodos
        .map(function (m, j) { return { j: j, d: Math.hypot(n.x - m.x, n.y - m.y) }; })
        .filter(function (o) { return o.j !== i; })
        .sort(function (a, b) { return a.d - b.d; })
        .slice(0, 3);
      vecinos.forEach(function (o) {
        const yaExiste = aristas.some(function (e) {
          return (e.a === o.j && e.b === i) || (e.a === i && e.b === o.j);
        });
        if (!yaExiste) aristas.push({ a: i, b: o.j });
      });
    });

    let visibles = new Set(Object.keys(NIVELES));
    let seleccionado = -1;

    function estaVisible(reg) { return visibles.has(reg.nivel_acceso); }

    function dibujar(t) {
      const W = lienzo.ancho();
      const H = lienzo.alto();
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      aristas.forEach(function (e) {
        const a = nodos[e.a];
        const b = nodos[e.b];
        if (!estaVisible(a.reg) || !estaVisible(b.reg)) return;
        ctx.strokeStyle = 'rgba(250, 246, 238, .10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.stroke();
      });

      nodos.forEach(function (n, i) {
        if (!estaVisible(n.reg)) return;
        const col = NIVELES[n.reg.nivel_acceso].color;
        const pulso = reducirMovimiento ? 1 : (0.78 + 0.22 * Math.sin(t * 0.0016 + n.fase));
        const activo = seleccionado === i;

        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r * (activo ? 3.1 : 2.2), 0, Math.PI * 2);
        ctx.fillStyle = col + '22';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r * (activo ? 1.35 : 1) * pulso, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();

        if (activo) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    function mostrarDetalle(reg) {
      if (!panel) return;
      const nivel = NIVELES[reg.nivel_acceso];
      panel.classList.add('tiene-dato');
      panel.innerHTML =
        '<strong>' + reg.titulo + '</strong>' +
        '<dl>' +
          '<dt>Identificador</dt><dd>' + reg.id + '</dd>' +
          '<dt>Comunidad</dt><dd>' + reg.comunidad + '</dd>' +
          '<dt>Territorio</dt><dd>' + reg.territorio + '</dd>' +
          '<dt>Año de registro</dt><dd>' + reg.anio + '</dd>' +
          '<dt>Nivel de acceso</dt><dd>' + nivel.etiqueta + '</dd>' +
          '<dt>Vectorizado</dt><dd>' + (reg.vectorizado ? 'Sí · embedding activo' : 'No · excluido del corpus') + '</dd>' +
          '<dt>CPLI</dt><dd>' + (reg.cpli ? 'Otorgado' : 'Pendiente') + '</dd>' +
        '</dl>' +
        '<p style="margin-top:12px;font-size:12px">' + reg.resumen + '</p>';
    }

    function detalleVacio() {
      if (!panel) return;
      panel.classList.remove('tiene-dato');
      panel.innerHTML = '<strong>Selecciona un nodo</strong><p>Haz clic sobre cualquier nodo ' +
        'del tejido para inspeccionar sus metadatos de gobernanza: comunidad, territorio, ' +
        'nivel de acceso y estado del CPLI.</p>';
    }

    canvas.addEventListener('click', function (ev) {
      const rect = canvas.getBoundingClientRect();
      const mx = (ev.clientX - rect.left) / rect.width;
      const my = (ev.clientY - rect.top) / rect.height;
      let mejor = -1;
      let mejorD = 0.05;
      nodos.forEach(function (n, i) {
        if (!estaVisible(n.reg)) return;
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d < mejorD) { mejorD = d; mejor = i; }
      });
      if (mejor >= 0) {
        seleccionado = mejor;
        mostrarDetalle(nodos[mejor].reg);
      }
    });

    $$('[data-nivel]').forEach(function (cb) {
      const nivel = cb.dataset.nivel;
      const contador = $('[data-conteo="' + nivel + '"]');
      if (contador) {
        contador.textContent = CORPUS.filter(function (r) {
          return r.nivel_acceso === nivel;
        }).length;
      }
      cb.addEventListener('change', function () {
        if (cb.checked) visibles.add(nivel); else visibles.delete(nivel);
        if (seleccionado >= 0 && !estaVisible(nodos[seleccionado].reg)) {
          seleccionado = -1;
          detalleVacio();
        }
      });
    });

    if (reducirMovimiento) {
      dibujar(0);
    } else {
      const bucle = function (t) { dibujar(t); requestAnimationFrame(bucle); };
      requestAnimationFrame(bucle);
    }
  }

  /* -----------------------------------------------------------
     5. ASISTENTE ETNOGRÁFICO · demo RAG
     ----------------------------------------------------------- */
  function iniciarAsistente() {
    const formulario = $('#rag-form');
    const registro = $('#rag-log');
    if (!formulario || !registro) return;

    const PERFILES = {
      visitante:    { niveles: ['publico'],                          etiqueta: 'Visitante' },
      investigador: { niveles: ['publico', 'restringido'],            etiqueta: 'Investigador acreditado' },
      comunidad:    { niveles: ['publico', 'restringido', 'sagrado'], etiqueta: 'Comunidad guardiana' }
    };

    let perfil = 'visitante';
    let consultas = 0;

    function permitido(nivel) {
      return PERFILES[perfil].niveles.indexOf(nivel) !== -1;
    }

    function normalizar(texto) {
      return String(texto).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ñ ]/g, ' ')
        .split(/\s+/).filter(function (palabra) { return palabra.length > 3; });
    }

    function buscar(consulta) {
      const palabras = normalizar(consulta);
      if (!palabras.length) return [];
      return CORPUS
        .map(function (registroSaber) {
          const texto = normalizar(
            registroSaber.titulo + ' ' + registroSaber.resumen + ' ' +
            registroSaber.tipo + ' ' + registroSaber.comunidad + ' ' + registroSaber.territorio
          );
          let puntos = 0;
          palabras.forEach(function (palabra) {
            if (texto.indexOf(palabra) !== -1) puntos++;
          });
          return { registro: registroSaber, puntos: puntos };
        })
        .filter(function (coincidencia) { return coincidencia.puntos > 0; })
        .sort(function (a, b) { return b.puntos - a.puntos; });
    }

    function crearBurbuja(texto, tipo) {
      const div = document.createElement('div');
      div.className = 'msg msg--' + (tipo || 'bot');
      const parrafo = document.createElement('div');
      parrafo.className = 'msg__texto';
      parrafo.textContent = texto;
      div.appendChild(parrafo);
      return div;
    }

    function responder(consulta) {
      const coincidencias = buscar(consulta);

      if (!coincidencias.length) {
        const mensaje = crearBurbuja(
          'No encontré registros que respondan a esa consulta en el corpus indexado. ' +
          'El corpus actual contiene ' + CORPUS.length + ' registros validados por comunidades guardianas. ' +
          'Prueba con términos sobre huertas, agua, plantas medicinales, rituales o café de sombra.'
        );
        mensaje.querySelector('.msg__texto').innerHTML +=
          '<div class="msg__fuente"><b>Recuperación:</b> 0 documentos sobre k = 5 · ' +
          '<b>vector store:</b> pgvector (índice cosine, 1536 dim)</div>';
        registro.appendChild(mensaje);
        return;
      }

      const saber = coincidencias[0].registro;

      if (!permitido(saber.nivel_acceso)) {
        const mensaje = crearBurbuja(
          'El registro que mejor coincide con tu consulta está clasificado como «' +
          NIVELES[saber.nivel_acceso].etiqueta + '» y no puedo reproducirlo ni resumirlo ' +
          'con tu perfil actual. Los conocimientos de carácter sagrado o restringido no se ' +
          'incorporan a respuestas generadas sin el Consentimiento Previo, Libre e Informado ' +
          '(CPLI) de su autoridad tradicional (Convenio 169 OIT).'
        );
        mensaje.querySelector('.msg__texto').innerHTML +=
          '<div class="msg__alerta"><b>Consulta registrada.</b> Referencia ' + saber.id + ' · ' +
          saber.comunidad + ' · ' + saber.territorio + '. Se ha abierto un trámite de autorización ' +
          'ante la autoridad guardiana; te notificaremos cuando se resuelva.</div>' +
          '<div class="msg__fuente"><b>Metadatos:</b> ' + saber.id + ' · ' + saber.comunidad + ' · ' +
          saber.territorio + ' · nivel_acceso: ' + saber.nivel_acceso + ' · vectorizado: ' +
          (saber.vectorizado ? 'sí' : 'no') + '</div>';
        registro.appendChild(mensaje);
        return;
      }

      const adicionales = coincidencias.slice(1, 4);
      const mensaje = crearBurbuja(saber.resumen);
      mensaje.querySelector('.msg__texto').innerHTML +=
        '<div class="msg__fuente"><b>Fuente:</b> ' + saber.titulo + ' — ' + saber.comunidad + ' · ' +
        saber.territorio + ' · ' + saber.anio + '<br><b>Registro:</b> ' + saber.id + ' · ' +
        'nivel_acceso: ' + saber.nivel_acceso + ' · CPLI: ' + (saber.cpli ? 'otorgado' : 'pendiente') +
        (adicionales.length
          ? '<br><b>También recuperado:</b> ' + adicionales.map(function (coincidencia) {
              return coincidencia.registro.id + ' (' + coincidencia.registro.comunidad + ')';
            }).join(', ')
          : '') +
        '</div>' +
        '<div class="msg__fuente" style="border-left-color:#e9b44c"><b>Recuperación:</b> ' +
        coincidencias.length + ' documentos sobre k = 5 · <b>vector store:</b> pgvector ' +
        '(índice cosine, filtro <code>nivel_acceso IN (' + PERFILES[perfil].niveles.join(', ') +
        ')</code>)</div>';
      registro.appendChild(mensaje);
    }

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();

      const campo = document.querySelector('#rag-entrada');
      const consulta = campo ? String(campo.value || '').trim() : '';
      if (!consulta) return;

      registro.appendChild(crearBurbuja(consulta, 'user'));
      campo.value = '';
      consultas++;

      const marcador = crearBurbuja('Consultando el corpus validado...', 'bot');
      registro.appendChild(marcador);
      registro.scrollTop = registro.scrollHeight;

      window.setTimeout(function () {
        if (marcador && marcador.parentNode) marcador.parentNode.removeChild(marcador);
        responder(consulta);
        registro.scrollTop = registro.scrollHeight;
        const contador = document.querySelector('#rag-contador');
        if (contador) contador.textContent = consultas;
      }, 620);
    });

    $$('.ejemplo').forEach(function (boton) {
      boton.addEventListener('click', function () {
        const campo = document.querySelector('#rag-entrada');
        if (campo) campo.value = boton.dataset.pregunta || '';
        formulario.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });
    });

    $$('.perfil__opcion').forEach(function (opcion) {
      function activar() {
        $$('.perfil__opcion').forEach(function (otra) { otra.classList.remove('is-activo'); });
        opcion.classList.add('is-activo');
        perfil = opcion.dataset.perfil;
      }
      opcion.addEventListener('click', activar);
      opcion.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); activar(); }
      });
    });
  }

  /* -----------------------------------------------------------
     Arranque
     ----------------------------------------------------------- */
  function iniciar() {
    iniciarTejidoHero();
    iniciarGrafoRepositorio();
    iniciarAsistente();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})();
