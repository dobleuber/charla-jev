# MedellínJS: JEV y los modelos de decisión

La presentación conserva 17 diapositivas y una hora de notas, incluidos diez minutos de preguntas. Las diapositivas 11 y 13 abren una página independiente de comparación; se presentan después de las dos simulaciones animadas. La interfaz, la evidencia y las notas están en español; los identificadores de JavaScript y de las APIs conservan sus nombres.

## Abrir la charla y las demos

Requiere Node.js 22 o superior y el Ollama instalado para esta charla. Desde esta carpeta, en dos terminales:

```sh
bash start-ollama.sh
```

```sh
node demo-server.mjs
```

- Presentación: http://127.0.0.1:8000/index.html
- Ticket: http://127.0.0.1:8000/demos.html#ticket
- Cinco correos: http://127.0.0.1:8000/demos.html#correos
- Notas: http://127.0.0.1:8000/outline.html

El servidor escucha solo en loopback. Abrir `file://` muestra un aviso para cambiar a HTTP; un servidor estático no ejecuta proveedores. Usa **Precargar LLM** para cargar el modelo antes de comparar. La precarga vacía y las consultas de disponibilidad no cuentan como evaluaciones. Para detener los procesos en primer plano, pulsa Ctrl+C.

## Habilitar JEV con la clave existente

JEV está deshabilitado por defecto. Para habilitarlo, reinicia el backend desde la sesión de fish que ya exporta `TYPESAFE_API_KEY`:

```fish
node demo-server.mjs --enable-jev
```

La variable se lee únicamente en el proceso del servidor. No se carga `.env`, no se copia la clave a archivos ni se muestra en el navegador. La autorización permanece en el servidor. Iniciar el backend no envía evaluaciones JEV; pulsar **Ejecutar** sí puede consumir créditos. El usuario autorizó las validaciones reales de esta charla. La API informa tokens, no un importe cobrado.

## Cómo usar la comparación

Escoge ticket o correos, elige un ejemplo claro o ambiguo y edita asunto y contenido. Ambos proveedores reciben la misma evidencia, preguntas y rúbrica. Un ticket contiene tres preguntas en una petición por proveedor; la bandeja contiene cinco correos y cinco preguntas dirigidas en una petición por proveedor.

**Ejecutar** inicia las solicitudes HTTP de los proveedores disponibles en paralelo. Cada tarjeta muestra eventos del servidor: preparación, HTTP iniciado, espera, respuesta recibida, validación y resultado o error. La animación indica espera; no representa tokens, progreso porcentual, etapas internas ni decisiones paralelas de los modelos. SSE transmite estos eventos del backend, no texto del modelo. Los cronómetros miden la espera observada y se detienen con el resultado; los contadores acumulan evaluaciones HTTP iniciadas desde que arrancó el servidor.

**Cancelar espera** aborta la espera del servidor. Si HTTP ya empezó, el proveedor puede procesar y cobrar la solicitud. No hay reintentos automáticos. **Actualizar** consulta el mismo identificador sin reenviar una evaluación. **Restablecer ejemplo** limpia resultados y restaura la evidencia; conserva los contadores de la sesión. Mientras se ejecuta, el editor y los controles que podrían crear otra evaluación quedan deshabilitados.

**Ver código JS** permite consultar las solicitudes exactas, JSON Schema y funciones del módulo Node que está corriendo. Los hashes del código y de la entrada vinculan ejecución y vista previa. El código está contraído por defecto.

## Qué se compara

JEV devuelve Choice con distribución y confianza, Score como media ponderada y Noul con valor 0–1. El LLM devuelve una categoría, un nivel ordinal entero y booleanos, restringidos por un JSON Schema real en `format` de Ollama. No se fabrican probabilidades del LLM. El corte de spam afecta solo a JEV; los booleanos locales se agrupan directamente.

La validez de la estructura no demuestra acierto. Media ponderada y nivel ordinal son medidas distintas. Las reglas de aplicación son didácticas: revisar si confianza JEV < 0,7; priorizar si urgencia >= 0,8; asignar responsable si Score >= 1,5; el LLM usa sus categorías/booleanos y nivel ordinal 2. Ninguna decisión aquí ejecuta acciones externas. La latencia remota incluye red; la local incluye CPU y carga cuando corresponde. Dos casos no son un benchmark general. Temperatura cero tampoco garantiza resultados idénticos.

Las animaciones preparadas de catálogo y revisión siguen en las diapositivas 9 y 10 y se identifican como simulaciones. Sus respuestas no sustituyen resultados reales.

## Runtime y validación

Ollama 0.40.3 usa el paquete oficial Arch `extra` CPU, verificado con SHA-256 y firma PGP. Binario dedicado: `/home/dobleuber/.local/share/charla-jev/ollama/bin/ollama`. Modelos: `/home/dobleuber/.local/share/charla-jev/models`. El wrapper excluye claves de proveedores, deshabilita cloud, usa contexto 4096 y un modelo cargado; no crea servicios ni cambia la configuración global.

Modelo local: `qwen3:1.7b`, Q4_K_M; la metadata informa tamaño de parámetros `2.0B`. Huella: `8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7`.

El backend usa APIs nativas de Node, sin SDK ni instalación de paquetes. Valida un vocabulario cerrado de JSON Schema para estos ejemplos; no es una biblioteca general de validación. Rechaza campos extra, claves JSON duplicadas, números no finitos, entradas vacías o demasiado largas y respuestas incoherentes. Los resultados expuestos omiten razonamiento interno y redactan ecos de la credencial. La sesión y la comprobación de origen protegen las operaciones POST; los archivos privados no se sirven. Un identificador de ejecución ya registrado devuelve el resultado existente.

Con el servidor local activo, ejecuta:

```sh
node --test *.test.cjs *.test.mjs
```

Las pruebas automatizadas usan proveedores simulados y servidores loopback. Chromium verifica navegación, la comparación, estados de espera/error/cancelación, doble clic, contadores, tamaño móvil, movimiento reducido y las notas de 17 diapositivas/60 minutos. Ninguna prueba automatizada general necesita créditos JEV.

## Evidencia de ejecuciones

La validación anterior del 14 de octubre de 2026 ejecutó dos peticiones JEV desde el backend JavaScript y el modelo local: ticket JEV 395,21 ms / LLM CPU 2533,58 ms; correos JEV 327,74 ms / LLM CPU 4215,52 ms. JEV devolvió `jev-1.13.0`, con 1171 tokens de entrada y 170 de salida en total. Son observaciones funcionales de la versión anterior, no medidas de la nueva página ni una promesa de rendimiento.

La evidencia anterior completa está en `/home/dobleuber/Documents/Codex/2026-10-13/task-16/jev-live-validation-20261014T150519Z/`. Las respuestas y agrupaciones difieren entre JEV y el LLM y se conservan tal como llegaron.

La nueva página cuenta con un registro independiente en `/home/dobleuber/Documents/Codex/2026-10-13/task-16/demo-redesign-20261014T221305Z/live-validation/`, con identificadores, solicitudes sin credenciales, respuestas redactadas, eventos y capturas de escritorio/móvil. Consulta ese registro para los resultados del rediseño.


Resultados de la nueva página (dos ejecuciones reales, sin reintentos):

| Escenario | JEV HTTP | LLM CPU HTTP | Tokens JEV entrada/salida |
| --- | ---: | ---: | ---: |
| Ticket | 378,77 ms | 3469,82 ms | 498 / 71 |
| Cinco correos | 329,79 ms | 6047,93 ms | 756 / 99 |

Total: **2 peticiones JEV**, 1254 tokens de entrada y 170 de salida; no hay importe monetario informado. JEV devolvió `jev-1.13.0`. En el ticket, JEV eligió `technical` con confianza 0,55 y Score 1,95; su regla de confianza envió el caso a revisión. El LLM eligió `technical`, nivel 2 y urgencia verdadera. En correos, JEV agrupó e01/e03/e04 como spam con corte 0,50; el LLM marcó solo e03. Estos desacuerdos se conservaron sin reemplazar respuestas ni inferir precisión.

Referencias oficiales: [API TypeSafe](https://docs.typesafe.ai/api), [primitivas](https://docs.typesafe.ai/primitives), [salidas estructuradas de Ollama](https://docs.ollama.com/capabilities/structured-outputs), [modelo Qwen](https://ollama.com/library/qwen3:1.7b).
