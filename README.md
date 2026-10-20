# Fundación Alma y Semilla — Sitio web

Sitio institucional **multipágina** para la Fundación Alma y Semilla (Chía, Cundinamarca):
*Etnotecnología y Saberes Ancestrales 5.0*. Construido a partir de la arquitectura de contenidos
definida para la entidad, con la calidad editorial y el sistema de diseño del prototipo previo.

---

## Estructura

```
Alma&SemillaWebsite/
├── index.html              # Inicio
├── objeto-social.html      # Objeto Social y Líneas de Acción
├── repositorio.html        # El Tejido Digital (Repositorio Vivo · RAG)
├── transparencia.html      # Gobierno Corporativo y Marco Legal
├── contacto.html           # Contacto y Alianzas
├── 404.html                # Página de error con la identidad visual
├── _headers                # Cabeceras de seguridad y caché (Cloudflare Pages)
├── robots.txt              # Directivas para buscadores
├── sitemap.xml             # Mapa del sitio
├── build.js                # Genera dist/ para el despliegue
├── assets/
│   ├── css/styles.css      # Sistema de diseño completo
│   ├── js/main.js          # Comportamiento compartido
│   ├── js/tejido.js        # Gráficos, grafo de conocimiento y asistente RAG
│   ├── img/logo.svg        # Logotipo
│   ├── img/patron-tejido.svg
│   └── docs/               # Estatutos, Política de Datos, Certificado (PDF)
├── site_examples/          # Prototipos originales (no se despliegan)
└── README.md
```

Sin framework, sin dependencias de terceros, sin CDN de iconos. Para verlo localmente basta con
abrir `index.html` o servir la carpeta:

```bash
python -m http.server 8000     # y abrir http://127.0.0.1:8000
```

---

## Despliegue en Cloudflare (Workers & Pages)

El repositorio está listo para conectar al proyecto de Cloudflare:

| Ajuste | Valor |
|---|---|
| Nombre del proyecto | `alma-semilla` (o el que prefieras) |
| Tipo | **Workers & Pages** → *Pages* → *Conectar a Git* |
| Repositorio | `xleriontech/Alma-Semilla` |
| Rama de producción | `main` |
| **Comando de build** | `node build.js` |
| **Directorio de salida** | `dist` |
| Directorio raíz | *(vacío — la raíz del repositorio)* |

`build.js` copia a `dist/` solo lo publicable (las 5 páginas, `404.html`, `assets/`, `_headers`,
`robots.txt` y `sitemap.xml`) y deja fuera `site_examples/`, que es material de trabajo.

### Sin paso de build (alternativa)

Si prefieres no usar build, en Cloudflare Pages pon:

- **Comando de build**: *(vacío)*
- **Directorio de salida**: `/`

Funciona igual, pero `site_examples/` quedaría publicado también.

### Después de conectar

- La URL provisional será `https://alma-semilla.pages.dev`; añade el dominio definitivo en
  *Custom domains*.
- Las cabeceras de `_headers` (CSP, HSTS, caché) se aplican automáticamente.
- Cada `push` a `main` dispara un redespliegue; Cloudflare solo reconstruye si cambian los archivos.

---

## Actualizar el sitio

```bash
# 1. Editar los archivos
# 2. Previsualizar
python -m http.server 8000

# 3. Publicar
node build.js          # genera dist/ (opcional, solo para revisar)
git add -A
git commit -m "Descripción del cambio"
git push
```

> **Importante**: el CSS y el JS se versionan por hash SHA-1 en la URL
> (`styles.css?v=bcdaa1ea`) para que los navegadores no sirvan una versión antigua desde su
> caché. `build.js` reescribe ese hash en cada compilación, así que basta con `node build.js`
> y hacer push: no hay que editarlo a mano. Si previsualizas sin compilar y acabas de tocar
> el CSS, fuerza la recarga con `Ctrl+F5`.

---

## Contenido por página

| Página | Secciones |
|---|---|
| **Inicio** | Hero (patrón étnico → nodos), Quiénes somos, Enfoque 4RI (IA RAG / VR 360° / IoT), Líneas de acción, Vista previa del repositorio, CTA |
| **Objeto Social** | Portada, contexto del Art. 4, las 4 líneas de investigación con sus registros, principios de operación, CTA |
| **Repositorio** | Portada, características del sistema, grafo interactivo de nodos, demo del Asistente Etnográfico, arquitectura técnica, CTA |
| **Transparencia** | Portada, marco normativo, política de privacidad de saberes (CPLI), documentos de descarga, datos registrales, CTA |
| **Contacto** | Portada, formulario con validación, datos, redes sociales, cuatro perfiles de aliado, CTA |

### Funcionalidad interactiva

- **Grafo de conocimiento** (`repositorio.html`): cada nodo es un registro del corpus, coloreado por
  `nivel_acceso`. Los filtros ocultan niveles; al hacer clic se inspeccionan sus metadatos
  (comunidad, territorio, CPLI, vectorización).
- **Asistente Etnográfico** (`repositorio.html#demo`): simula el ciclo RAG completo. El perfil de
  acceso (visitante / investigador acreditado / comunidad guardiana) decide qué niveles puede recuperar
  el motor. Ante un registro restringido o sagrado, **rechaza la respuesta, cita el registro y deja
  constancia de la consulta**. La respuesta siempre incluye fuente comunitaria y geográfica.
- **Hero con canvas**: el patrón geométrico ancestral se disuelve progresivamente en una red de
  nodos, con hilos que conectan ambas capas.

---

## Arquitectura técnica de referencia

La demo del repositorio es funcional pero opera sobre un corpus de ejemplo. Para producción:

| Capa | Tecnología recomendada |
|---|---|
| Backend RAG | **LangChain** o **LlamaIndex** + base vectorial **pgvector** (PostgreSQL) o **Pinecone** |
| Clave de diferenciación | **Filtrado por metadatos**: cada documento lleva `nivel_acceso` (`publico` / `comunidad` / `sagrado`) y el filtro se aplica **antes** de la recuperación |
| Frontend | **Next.js** o **Nuxt.js** con SSR, para indexación de cada registro por separado |
| Visualización 3D | **Three.js** o **React Three Fiber** (aquí se resuelve con Canvas 2D, sin dependencias) |
| Cumplimiento legal | Checkbox obligatorio de la política de datos (Ley 1581/2012) y módulo de admin para adjuntar el **Acta de CPLI** firmada, vinculada de forma inseparable al documento |

### Metadatos mínimos por registro

```json
{
  "id": "ETN-001",
  "titulo": "Cerramiento cyclical de la huerta familiar",
  "comunidad": "Sabedores de Vereda Fonquetá",
  "territorio": "Chía, Cundinamarca",
  "anio": 2019,
  "nivel_acceso": "publico",
  "cpli": true,
  "cpli_url": "/cpli/ETN-001-acta.pdf",
  "vectorizado": true,
  "coords": [4.868, -74.132]
}
```

---

## Decisiones técnicas

- **Versionado de assets por hash**: las URLs de CSS/JS llevan `?v=<hash sha1>`, de modo que un
  despliegue nunca sirve una versión obsoleta desde la caché del navegador.
- **Mejora progresiva**: si el JavaScript está desactivado, todo el contenido sigue visible (las
  animaciones de aparición solo se ocultan cuando hay JS activo, mediante la clase `.js`).
- **Sin dependencias de iconos**: 34 iconos SVG en línea dentro de cada página.
- **Accesibilidad**: skip link, `aria-current` en la navegación, `aria-pressed` en los filtros,
  `aria-live` en el asistente, `:focus-visible`, `prefers-reduced-motion`, `alt` y `label` en todos
  los campos.
- **Responsive** verificado a 320 / 390 / 820 / 1440 px sin desbordes horizontales.

---

## ⚠️ Antes de publicar

1. **Datos registrales** — NIT, matrícula, CIIU, dirección legal y contactos están tomados del
   prototipo: **verifícalos** contra el RUT y el certificado vigente.
2. **Correo institucional** — `contacto@almaysemilla.org` es una sugerencia; hay que crearlo o
   sustituirlo por la dirección real.
3. **Redes sociales** — los iconos de LinkedIn, GitHub e Instagram apuntan a las plataformas
   genéricas: hay que enlazar las cuentas oficiales.
4. **Documentos PDF** — `assets/docs/*.pdf` son **modelos de estructura** generados para que las
   descargas funcionen. Deben reemplazarse por los documentos oficiales firmados.
5. **Formularios** — validan y muestran confirmación, pero **no envían**. Conectar a un backend
   (Formspree, API propia, etc.).
6. **Corpus y telemetría** — los 14 registros son de ejemplo. Sustituirlos por los saberes validados
   por las comunidades guardianas, con su Acta de CPLI.
7. **Fotografías** — apuntan a Unsplash. Descargar las imágenes reales de la fundación a
   `assets/img/` (cada `<figure>` tiene un fondo degradado de respaldo).
8. **Dominio** — las etiquetas `canonical` apuntan a `https://almaysemilla.org/`: ajustar al
   dominio definitivo.

---

## Paleta y tipografía

Custom properties en `assets/css/styles.css` (bloque `:root`):

| Token | Valor | Uso |
|---|---|---|
| `--bosque` | `#143627` | Verde institucional, fondos oscuros |
| `--hoja` / `--hoja-cl` | `#3f6b3a` / `#8fb57a` | Verde hoja, acentos vivos |
| `--esmeralda` | `#10b981` | Acento tecnológico, CTA |
| `--sol` | `#e9b44c` | Oro, maíz — detalles y remates |
| `--terracota` | `#c85a32` | Tierra, CTA cálidos |
| `--crema` / `--arena` | `#faf6ee` / `#f1e7d6` | Fondos claros |
| `--violeta` | `#6a1b9a` | Identidad Colombia 5.0 |

Tipografías: **Fraunces** (títulos) · **Nunito** (texto) · **JetBrains Mono** (cifras de telemetría).

---

## Verificación realizada

Probado en Chromium real a 1440 / 820 / 390 / 320 px:

- 5 páginas sin errores de consola ni peticiones fallidas
- 0 iconos rotos, 1 `<h1>` por página, `title`/`description`/`keywords`/`canonical` en todas
- 100 % de las animaciones de aparición activadas en escritorio y móvil
- 0 desbordes horizontales
- Asistente RAG: cita fuente, rechaza contenido sagrado para visitantes, responde con perfil de
  comunidad guardiana, y gestiona el caso sin coincidencias
- Formulario de contacto: validación de campos obligatorios y confirmación de envío
- Los 3 PDF de descarga responden 200 y son structurally válidos
