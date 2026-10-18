# MedellínJS: JEV y los modelos de decisión

Presentación de la charla «JEV y los modelos de decisión» para MedellínJS, con sus notas del presentador y los ejemplos que se ejecutan en vivo durante la charla. Todo es JavaScript sin dependencias: solo necesitas Node.js 22 o superior, y no hay que instalar paquetes.

## Arrancar la presentación

Desde la carpeta del proyecto:

```sh
npm start
```

Abre http://127.0.0.1:8000/index.html. Avanza con las flechas o la barra espaciadora; el botón **Notas** abre las notas del presentador de la diapositiva actual, y las notas completas están en http://127.0.0.1:8000/outline.html. Para detener el servidor, pulsa Ctrl+C.

Para ver las diapositivas no necesitas Ollama ni una clave de JEV. Solo hacen falta para ejecutar las demos en vivo.

## Presentar con las demos en vivo

Las diapositivas de las demos en vivo tienen un botón **Abrir la demo y comparar** que abre la página de comparación. Para que esas demos ejecuten de verdad, arranca dos procesos en terminales separadas (la primera vez, sigue antes [Preparar las demos en vivo](#preparar-las-demos-en-vivo)):

1. El LLM local:

   ```sh
   npm run ollama
   ```

2. El servidor con JEV habilitado, en una terminal que tenga exportada tu clave:

   ```sh
   export TYPESAFE_API_KEY=tu-clave
   ```

   ```sh
   npm run start:jev
   ```

3. Abre http://127.0.0.1:8000/index.html y presenta. En cada demo, pulsa **Precargar LLM** antes de **Ejecutar**.

Sin clave, `npm start` también sirve las demos, pero solo con el LLM local. Iniciar el servidor no envía nada a JEV; cada vez que pulsas **Ejecutar** se envía una petición que puede consumir créditos.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm start` | Sirve la presentación, las notas y las demos (solo con el LLM local). |
| `npm run start:jev` | Lo mismo, con JEV habilitado. Requiere `TYPESAFE_API_KEY` en el entorno. |
| `npm run ollama` | Inicia el Ollama aislado de la charla (`start-ollama.sh`). |
| `npm run ollama:modelos` | Descarga en ese Ollama los modelos de las demos. Requiere `npm run ollama` corriendo. |
| `npm test` | Ejecuta las pruebas. Requiere el servidor activo en el puerto 8000 y Chromium. |

El servidor acepta además `--port <número>`, `--local-model <nombre>` y `--vision-model <nombre>`; por ejemplo, `npm start -- --port 8080`. Escucha solo en `127.0.0.1`.

## Qué incluye

- **Presentación** (`index.html`): las diapositivas, con dos demos animadas de catálogo y revisión que usan datos preparados.
- **Notas del presentador** (`outline.html`): el guion de cada diapositiva, con tiempos, ideas clave y fuentes.
- **Demos en vivo** (`demos.html`): envían el mismo caso a JEV (TypeSafe) y a un LLM local con Ollama, y comparan sus respuestas tipadas lado a lado:
  - **Ticket de soporte:** un ticket y tres preguntas (categoría, frustración y urgencia) en una sola petición por proveedor.
  - **Cinco correos:** una bandeja de cinco correos y cinco preguntas de spam, también en una sola petición por proveedor.
  - **Reclamo con foto (experimental):** un reclamo y una foto del paquete, con cuatro preguntas: si hay daño, de qué tipo, si coincide con el reclamo y dónde está (un recuadro sobre la imagen).

## Preparar las demos en vivo

Solo hace falta una vez.

1. Clona el repositorio:

   ```sh
   git clone https://github.com/dobleuber/charla-jev.git
   ```

   ```sh
   cd charla-jev
   ```

2. Instala [Ollama](https://ollama.com/download) (se probó con la versión 0.40.3) y descarga los dos modelos: `qwen3:1.7b` para el texto y `qwen3-vl:2b-instruct` para la foto. Con una instalación normal de Ollama:

   ```sh
   ollama pull qwen3:1.7b
   ```

   ```sh
   ollama pull qwen3-vl:2b-instruct
   ```

   Si Ollama no corre ya como servicio, inícialo con `ollama serve` en lugar de `npm run ollama`. El backend se conecta a Ollama en `http://127.0.0.1:11434`.

3. Opcional: consigue una clave de API de [TypeSafe](https://docs.typesafe.ai/api) para comparar con JEV.

<details>
<summary>Ollama aislado con <code>npm run ollama</code></summary>

`npm run ollama` ejecuta `start-ollama.sh`, que usa un binario de Ollama dedicado sin heredar claves de proveedores ni tocar la configuración global: deshabilita cloud, usa contexto 4096 y mantiene un solo modelo cargado. Espera el binario en `~/.local/share/charla-jev/ollama/bin/ollama` (o bajo `$XDG_DATA_HOME` si está definido) y guarda los modelos en `~/.local/share/charla-jev/models`. Con ese Ollama corriendo, descarga los modelos desde otra terminal:

```sh
npm run ollama:modelos
```

Como mantiene un solo modelo cargado, al pasar de las demos de texto a la de la foto Ollama cambia de modelo: vuelve a pulsar **Precargar LLM** al cambiar de pestaña.

</details>

## Las demos paso a paso

### Ticket de soporte

1. Abre http://127.0.0.1:8000/demos.html#ticket. Arriba a la derecha verás si JEV y el LLM están disponibles.
2. Pulsa **Precargar LLM** para cargar el modelo antes de la primera ejecución; así el tiempo medido no incluye la carga.
3. Elige un ejemplo: **Problema claro y urgente**, **Mensaje poco preciso** o **Cobro que necesita revisión**. Puedes editar el asunto y el contenido.
4. Pulsa **Ejecutar** (sin JEV habilitado, el botón dice **Ejecutar solo en LLM local**). Los proveedores disponibles reciben la misma evidencia, preguntas y rúbrica en paralelo. Cada tarjeta muestra los eventos reales del servidor (HTTP iniciado, respuesta recibida, validación) y, al final, las respuestas y lo que decide el código con ellas.
5. Pulsa **Ver código JS** para ver las solicitudes exactas, el JSON Schema y las funciones del servidor que se ejecutaron.

### Cinco correos

1. Abre http://127.0.0.1:8000/demos.html#correos o cambia a la pestaña **Cinco correos**.
2. Elige **Bandeja mixta** o **Promoción o conversación**, y edita los correos si quieres.
3. Pulsa **Ejecutar**: cada proveedor responde las cinco preguntas en una sola petición.
4. Cambia el **Corte de spam para JEV** entre 0,50 y 0,80. Los correos se reagrupan con la misma respuesta, sin enviar otra petición. El corte solo aplica a JEV: el LLM responde sí o no, sin probabilidad.

### Reclamo con foto

Esta demo usa las imágenes y las preguntas Box de JEV, que TypeSafe marca como preliminares: el servidor fija el modelo `jev-1.14.0` y envía el encabezado `TypeSafe-Danger-Zone-Images: true`, pero el formato puede cambiar.

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

Con el servidor activo en el puerto 8000 (`npm start`) y Chromium instalado:

```sh
npm test
```

Las pruebas usan proveedores simulados y servidores locales, así que no consumen créditos de JEV ni necesitan Ollama.

## Referencias

[API de TypeSafe](https://docs.typesafe.ai/api), [primitivas de JEV](https://docs.typesafe.ai/primitives), [salidas estructuradas de Ollama](https://docs.ollama.com/capabilities/structured-outputs), [imágenes en JEV](https://docs.typesafe.ai/images), [preguntas Box](https://docs.typesafe.ai/primitives/box), [modelo Qwen3 1.7B](https://ollama.com/library/qwen3:1.7b), [modelo Qwen3-VL](https://ollama.com/library/qwen3-vl).
