# MedellínJS: JEV y los modelos de decisión

Material de la charla «JEV y los modelos de decisión» para MedellínJS. Esta guía explica cómo ejecutar en tu máquina la presentación y los ejemplos en vivo.

## Qué incluye

- **Presentación** (`index.html`): las diapositivas de la charla, con dos demos animadas de catálogo y revisión que usan datos preparados.
- **Notas del presentador** (`outline.html`): el guion de cada diapositiva, con tiempos, ideas clave y fuentes.
- **Ejemplos en vivo** (`demos.html`): envían el mismo caso a JEV (TypeSafe) y a un LLM local con Ollama, y comparan sus respuestas tipadas lado a lado:
  - **Ticket de soporte:** un ticket y tres preguntas (categoría, frustración y urgencia) en una sola petición por proveedor.
  - **Cinco correos:** una bandeja de cinco correos y cinco preguntas de spam, también en una sola petición por proveedor.
  - **Reclamo con foto (experimental):** un reclamo y una foto del paquete, con cuatro preguntas: si hay daño, de qué tipo, si coincide con el reclamo y dónde está (un recuadro sobre la imagen).

Todo es JavaScript sin dependencias: el backend usa solo APIs nativas de Node y no hay que instalar paquetes.

## Requisitos

- Node.js 22 o superior.
- [Ollama](https://ollama.com/download) con los modelos `qwen3:1.7b` (texto) y `qwen3-vl:2b-instruct` (multimodal, para el reclamo con foto). Los ejemplos se probaron con Ollama 0.40.3.
- Opcional: una clave de API de [TypeSafe](https://docs.typesafe.ai/api) para comparar con JEV. Sin ella, los ejemplos funcionan solo con el LLM local.
- Opcional: Chromium, para las pruebas de navegador.

## 1. Clonar el repositorio

```sh
git clone https://github.com/dobleuber/charla-jev.git
```

```sh
cd charla-jev
```

## 2. Preparar el LLM local

El backend se conecta a Ollama en `http://127.0.0.1:11434`. Con una instalación normal de Ollama, descarga los modelos:

```sh
ollama pull qwen3:1.7b
```

```sh
ollama pull qwen3-vl:2b-instruct
```

Si Ollama no corre ya como servicio, inícialo en otra terminal con `ollama serve`.

<details>
<summary>Alternativa: Ollama aislado con <code>start-ollama.sh</code></summary>

`start-ollama.sh` ejecuta un binario de Ollama dedicado, sin heredar claves de proveedores ni tocar la configuración global: deshabilita cloud, usa contexto 4096 y mantiene un solo modelo cargado. Espera el binario en `~/.local/share/charla-jev/ollama/bin/ollama` (o bajo `$XDG_DATA_HOME` si está definido) y guarda los modelos en `~/.local/share/charla-jev/models`.

```sh
bash start-ollama.sh
```

Con el script corriendo, descarga los modelos desde otra terminal:

```sh
OLLAMA_HOST=127.0.0.1:11434 ~/.local/share/charla-jev/ollama/bin/ollama pull qwen3:1.7b
```

```sh
OLLAMA_HOST=127.0.0.1:11434 ~/.local/share/charla-jev/ollama/bin/ollama pull qwen3-vl:2b-instruct
```

El script mantiene un solo modelo cargado, así que al pasar de los ejemplos de texto al de la foto Ollama cambia de modelo; vuelve a pulsar **Precargar LLM** al cambiar de pestaña.

</details>

## 3. Iniciar el servidor

Solo con el LLM local:

```sh
node demo-server.mjs
```

Para comparar también con JEV, exporta tu clave en la misma terminal e inicia el servidor con `--enable-jev`:

```sh
export TYPESAFE_API_KEY=tu-clave
```

```sh
node demo-server.mjs --enable-jev
```

La clave se lee solo en el proceso del servidor: no se carga `.env`, no se escribe en archivos ni llega al navegador. Iniciar el servidor no envía nada a JEV; cada vez que pulsas **Ejecutar** se envía una petición que puede consumir créditos.

Otras opciones: `--local-model <nombre>` y `--vision-model <nombre>` para usar otros modelos de Ollama en los ejemplos de texto y en el de la foto, y `--port <número>` para cambiar el puerto (por defecto, 8000). El servidor escucha solo en `127.0.0.1`.

## 4. Abrir la presentación

Abre http://127.0.0.1:8000/index.html. Avanza con las flechas o la barra espaciadora; el botón **Notas** abre las notas del presentador de la diapositiva actual. Las diapositivas de los ejemplos en vivo tienen un botón que abre la página de comparación.

Las notas completas están en http://127.0.0.1:8000/outline.html. La presentación también funciona sin Ollama ni JEV; solo los ejemplos en vivo los necesitan.

## 5. Ejecutar el ejemplo del ticket

1. Abre http://127.0.0.1:8000/demos.html#ticket. Arriba a la derecha verás si JEV y el LLM están disponibles.
2. Pulsa **Precargar LLM** para cargar el modelo antes de la primera ejecución; así el tiempo medido no incluye la carga.
3. Elige un ejemplo: **Problema claro y urgente**, **Mensaje poco preciso** o **Cobro que necesita revisión**. Puedes editar el asunto y el contenido.
4. Pulsa **Ejecutar** (sin JEV habilitado, el botón dice **Ejecutar solo en LLM local**). Los proveedores disponibles reciben la misma evidencia, preguntas y rúbrica en paralelo. Cada tarjeta muestra los eventos reales del servidor (HTTP iniciado, respuesta recibida, validación) y, al final, las respuestas y lo que decide el código con ellas.
5. Pulsa **Ver código JS** para ver las solicitudes exactas, el JSON Schema y las funciones del servidor que se ejecutaron.

## 6. Ejecutar el ejemplo de los cinco correos

1. Abre http://127.0.0.1:8000/demos.html#correos o cambia a la pestaña **Cinco correos**.
2. Elige **Bandeja mixta** o **Promoción o conversación**, y edita los correos si quieres.
3. Pulsa **Ejecutar**: cada proveedor responde las cinco preguntas en una sola petición.
4. Cambia el **Corte de spam para JEV** entre 0,50 y 0,80. Los correos se reagrupan con la misma respuesta, sin enviar otra petición. El corte solo aplica a JEV: el LLM responde sí o no, sin probabilidad.

## 7. Ejecutar el ejemplo del reclamo con foto

Este ejemplo usa las imágenes y las preguntas Box de JEV, que TypeSafe marca como preliminares: el servidor fija el modelo `jev-1.14.0` y envía el encabezado `TypeSafe-Danger-Zone-Images: true`, pero el formato puede cambiar.

1. Abre http://127.0.0.1:8000/demos.html#foto o cambia a la pestaña **Reclamo con foto**.
2. Pulsa **Precargar LLM** para cargar el modelo multimodal. En CPU, el LLM local tarda decenas de segundos en procesar cada foto nueva.
3. Elige **Caja golpeada**, **Caja intacta** o **Foto poco clara**. Puedes editar el texto del reclamo; la foto es la misma para ambos proveedores.
4. Pulsa **Ejecutar**. Cada tarjeta dibuja su propio recuadro sobre la foto y muestra lo que decide el código: revisión prioritaria con evidencia, revisión manual o pedir otra foto. Nunca se aprueba un reembolso automático.

Las fotos están en `fotos/`. Para usar las tuyas, reemplaza esos archivos conservando los nombres. Deben ser PNG o JPEG de 280 a 1568 px por lado y estar guardadas derechas: JEV no aplica la rotación EXIF, así que el servidor rechaza las fotos que la tengan. Con ImageMagick puedes prepararlas así:

```sh
magick tu-foto.jpg -auto-orient -resize '1568x1568>' -strip fotos/caja-golpeada.jpg
```

**Cancelar espera** deja de esperar la respuesta, pero si la petición ya salió, el proveedor puede procesarla y cobrarla. No hay reintentos automáticos. **Restablecer ejemplo** limpia los resultados y restaura el texto original.

## Qué se compara

JEV devuelve Choice con distribución y confianza, Score como media ponderada, Noul con un valor de 0 a 1 y Box como bordes normalizados de 0 a 1 con confianza. El LLM devuelve una categoría, un nivel ordinal entero, booleanos y un recuadro `bbox_2d` con coordenadas de 0 a 1000 (el formato nativo de Qwen-VL), restringidos por un JSON Schema en el parámetro `format` de Ollama. El servidor solo normaliza ese recuadro para dibujarlo; no se fabrican probabilidades ni confianza para el LLM.

Box siempre devuelve un recuadro, aunque no haya daño, así que la página solo lo dibuja cuando la pregunta de daño visible lo respalda.

Una estructura válida no demuestra que la respuesta sea correcta, y una media ponderada y un nivel ordinal son medidas distintas. Las reglas de aplicación son didácticas: revisar si la confianza de JEV es menor que 0,7, priorizar si la urgencia es al menos 0,8 y asignar responsable si Score es al menos 1,5; el LLM usa sus categorías, booleanos y el nivel ordinal 2. Ninguna decisión ejecuta acciones externas. La latencia remota incluye la red y la local depende de tu CPU. Unos pocos casos no son un benchmark, y temperatura cero no garantiza resultados idénticos.

## Cómo funciona el backend

`demo-server.mjs` valida un vocabulario cerrado de JSON Schema para estos ejemplos; no es una biblioteca general de validación. Rechaza campos extra, claves JSON duplicadas, números no finitos, entradas vacías o demasiado largas y respuestas incoherentes. Los resultados omiten el razonamiento interno del modelo y ocultan cualquier eco de la clave. Un token de sesión y la comprobación de origen protegen las operaciones POST.

## Pruebas

Con el servidor activo en el puerto 8000 y Chromium instalado:

```sh
node --test *.test.cjs *.test.mjs
```

Las pruebas usan proveedores simulados y servidores locales, así que no consumen créditos de JEV ni necesitan Ollama.

## Referencias

[API de TypeSafe](https://docs.typesafe.ai/api), [primitivas de JEV](https://docs.typesafe.ai/primitives), [salidas estructuradas de Ollama](https://docs.ollama.com/capabilities/structured-outputs), [imágenes en JEV](https://docs.typesafe.ai/images), [preguntas Box](https://docs.typesafe.ai/primitives/box), [modelo Qwen3 1.7B](https://ollama.com/library/qwen3:1.7b), [modelo Qwen3-VL](https://ollama.com/library/qwen3-vl).
