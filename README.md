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
├── wrangler.jsonc          # Configuración del Worker (Cloudflare)
├── src/index.js            # Worker que sirve los assets estáticos
├── package.json            # Scripts de build y deploy
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

Hay dos rutas válidas. La que ves en el panel al conectar un repositorio de Git es la de
**Workers**; para un sitio puramente estático, **Pages** es algo más simple.

### Ruta A — Workers (la que aparece en tu pantalla)

El repositorio ya incluye `wrangler.jsonc` y `src/index.js`, así que solo hay que rellenar
estos campos:

| Campo | Valor |
|---|---|
| Project name | `alma-semilla` |
| **Build command** | `node build.js` |
| Deploy command | `npx wrangler deploy` *(el valor por defecto, déjalo así)* |
| Preview command | `npx wrangler preview` *(el valor por defecto, déjalo así)* |

Pulsa **Deploy**. Cloudflare ejecutará `npm install`, luego `node build.js` (que genera `dist/`)
y después `npx wrangler deploy`, que sube el Worker con los assets estáticos enlazados.

> El `Build command` **no puede quedar vacío**: sin él, `dist/` no existe y el Worker sube
> una carpeta de assets vacía.

Si prefieres usar los scripts de `package.json` (que encadenan el build con el deploy):

- **Build command**: `npm run build`
- **Deploy command**: `npx wrangler deploy`

### Ruta B — Pages (más simple, sin Worker)

En el panel, en vez de *Workers*, elige la pestaña **Pages** → *Conectar a Git*:

| Campo | Valor |
|---|---|
| Nombre del proyecto | `alma-semilla` |
| Repositorio | `xleriontech/Alma-Semilla` |
| Rama de producción | `main` |
| **Comando de build** | `node build.js` |
| **Directorio de salida** | `dist` |

### Sin paso de build (alternativa)

Si prefieres no usar build, en Cloudflare Pages pon:

- **Comando de build**: *(vacío)*
- **Directorio de salida**: `/`

Funciona igual, pero `site_examples/` quedaría publicado también.

### ⚠️ Importante: el repositorio es privado y la app de Cloudflare necesita acceso

Cuando el repositorio pasa de público a privado, **GitHub revoca el acceso de las apps instaladas
que solo lo tenían por ser público**. Si eso ocurre, los pushes dejan de disparar builds y el
panel muestra el proyecto sin actividad.

**Solución (una sola vez):**

1. En GitHub, ve a *Settings → Applications → Installed GitHub Apps*.
2. Busca **Cloudflare Workers and Pages** y pulsa *Configure*.
3. En *Repository access* elige **Only select repositories** y marca `Alma-Semilla`
   (o elige **All repositories**).
4. Guarda los cambios.

**Cómo comprobar si la app tiene acceso** (no necesitas permisos de administrador):

```bash
curl -H "Authorization: Bearer <tu_token>" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/xleriontech/Alma-Semilla/subscribers
```

Si la respuesta es `[]`, la app no tiene acceso y los builds no se dispararán.

### Alternativa: despliegue desde el equipo

Si prefieres no depender de la app de GitHub, puedes desplegar directamente:

```bash
npm install
npm run deploy          # = node build.js && wrangler deploy
```

Necesita `wrangler login` (abre el navegador) o un token de API en la variable
`CLOUDFLARE_API_TOKEN`.

---

### Después de conectar

- La URL provisional será `https://alma-semilla.pages.dev` (o `https://alma-semilla.<subdominio>.workers.dev`
  en el caso de Workers); añade el dominio definitivo en *Custom domains*.
- Las cabeceras de `_headers` (CSP, HSTS, caché) se aplican automáticamente en ambas rutas.
- Cada `push` a `main` dispara un redespliegue; Cloudflare solo reconstruye si cambian los archivos.

### Probar el Worker en local

```bash
npm install
npm run preview     # build + wrangler dev en http://127.0.0.1:8788
```

> En Windows, la carpeta del proyecto contiene un `&` en el nombre y eso rompe el shim
> `node_modules/.bin`. Invoca wrangler directamente: `node node_modules/wrangler/bin/wrangler.js dev`.
> En Linux (Cloudflare) no ocurre.

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

### Vista previa al compartir el enlace (Open Graph)

Cuando alguien comparte un enlace del sitio en WhatsApp, Slack, X, LinkedIn o Facebook, la
mensajería muestra una **tarjeta con el logotipo, el nombre y la descripción** de la Fundación.

### Qué se necesita

- `assets/img/og-cover.jpg` — imagen de portada de **1200 × 630** (el tamaño estándar),
  generada con el logo, el lema y la red de nodos sobre el fondo institucional.
- Etiquetas `og:*` y `twitter:*` en el `<head>` de cada página, con título y descripción
  propios de esa página.

### Configurar el dominio

Las vistas previas necesitan **URLs absolutas**. El dominio se define en un solo sitio:

```json
// site.config.json
{
  "url": "https://almaysemilla.org"
}
```

Al compilar, `build.js` reescribe con ese dominio las URLs absolutas de Open Graph, las
`canonical` y el `sitemap.xml`. También puedes fijarlo sin tocar el archivo:

```bash
SITE_URL=https://otro-dominio.com npm run build
```

**Cuando confirmes el dominio definitivo, cambia `url` en `site.config.json` y vuelve a
desplegar.** Las vistas previas que se compartan antes de eso quedarán con el dominio
anterior: los reproductores las guardan en caché, y conviene pedir su reindexación.

### Comprobar el resultado

- [OpenGraph debugger](https://www.opengraph.xyz/) o el depurador de Facebook
- [Card validator de Twitter](https://cards-dev.twitter.com/validator)
- Pegando la URL en un chat de WhatsApp o Telegram

---

## Progressive Web App (PWA)

El sitio es **instalable** y **funciona sin conexión**.

### Qué incluye

| Archivo | Para qué sirve |
|---|---|
| `manifest.webmanifest` | Nombre, icono, color de tema, modo `standalone` y 4 accesos directos (Repositorio, Objeto Social, Transparencia, Contacto) |
| `sw.js` | Service worker: caché y modo sin conexión |
| `offline.html` | Página de respaldo cuando no hay red |
| `assets/img/icon-*.png` | Iconos 192, 512 y versiones *maskable* (zona segura del 58 %), más el `apple-touch-icon` de 180 |

### Estrategia de caché

- **Navegación (HTML)**: red primero → caché → `offline.html`. Así el sitio siempre está al día
  cuando hay red, y sigue disponible cuando no.
- **Assets con hash** (`?v=...`, en `/assets/`): caché primero. Son inmutables, no hace falta
  volver a pedirlos.
- **Recursos externos** (fuentes de Google, imágenes): red primero con respaldo en caché.

### Instalar en el dispositivo

- **Chrome / Edge (escritorio)**: aparece el icono de instalación en la barra de direcciones, o
  usa el botón *Instalar la aplicación* del pie de página.
- **Android (Chrome)**: menú *⋮* → *Añadir a pantalla de inicio*.
- **iOS / iPadOS**: botón *Compartir* → *Añadir a pantalla de inicio*. El pie de página explica
  el procedimiento cuando el navegador no expone la instalación automática.

Una vez instalada, la aplicación se abre a pantalla completa, sin barra de navegador, y conserva
el icono y el color de la Fundación.

> La instalación automática solo se ofrece en `https` (o `localhost`). En Cloudflare el sitio ya
> sirve por HTTPS, así que funciona.

---

## Accesibilidad: auditoría de contraste

El sitio cumple el mínimo **WCAG AA**: 4,5:1 para texto normal y 3:1 para texto grande.

Para comprobarlo (no forma parte del despliegue, no requiere nada en Cloudflare):

```bash
npm i -D playwright
npx playwright install chromium
node tools/auditar-contraste.mjs
```

El script recorre las cinco páginas, calcula el color de fondo efectivo de cada texto —incluidos
los degradados del hero y de los paneles— y lista los que no llegan al mínimo. Actualmente
devuelve **0 incumplimiento** en las cinco páginas.

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
