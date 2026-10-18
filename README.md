# MedellínJS: JEV y los modelos de decisión

Presentación de la charla «JEV y los modelos de decisión» para MedellínJS, con sus notas del presentador y los ejemplos que se ejecutan en vivo durante la charla. Todo es JavaScript sin dependencias: solo necesitas Node.js 22 o superior, y no hay que instalar paquetes.

## Arrancar la presentación

Desde la carpeta del proyecto:

```sh
npm start
```

Ese único comando levanta todo lo que la charla necesita:

- **Ollama**, para el LLM local de las demos. Si ya está corriendo, lo reutiliza; si no, inicia el Ollama aislado de la charla (ver más abajo) o el `ollama` del sistema.
- **El servidor** de la presentación, las notas y las demos.
- **JEV**, solo si exportaste `TYPESAFE_API_KEY` antes de arrancar.

Abre http://127.0.0.1:8000/index.html. Avanza con las flechas o la barra espaciadora; el botón **Notas** abre las notas del presentador de la diapositiva actual, y las notas completas están en http://127.0.0.1:8000/outline.html. Ctrl+C detiene todo lo que `npm start` haya iniciado.

Las diapositivas de las demos en vivo tienen un botón **Abrir la demo y comparar** que abre la página de comparación. En cada demo, pulsa **Precargar LLM** antes de **Ejecutar**.

Para comparar también con JEV, exporta tu clave antes de arrancar:

```sh
export TYPESAFE_API_KEY=tu-clave
```

```sh
npm start
```

Iniciar el servidor no envía nada a JEV; cada vez que pulsas **Ejecutar** se envía una petición que puede consumir créditos. Para arrancar sin JEV aunque la clave esté exportada: `npm start -- --sin-jev`.

Las diapositivas se ven sin Ollama ni JEV; solo las demos en vivo los necesitan. Si falta algún modelo, `npm start` lo avisa al arrancar.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm start` | Levanta Ollama (si hace falta), el servidor y, si hay clave, JEV. |
| `npm run modelos` | Descarga los modelos de las demos. Inicia Ollama si no está corriendo. |
| `npm test` | Ejecuta las pruebas. Requiere `npm start` activo en el puerto 8000 y Chromium. |

`npm start` también acepta `--port <número>`, `--local-model <nombre>` y `--vision-model <nombre>`; por ejemplo, `npm start -- --port 8080`. El servidor escucha solo en `127.0.0.1`.

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

2. Instala [Ollama](https://ollama.com/download) (se probó con la versión 0.40.3).

3. Descarga los dos modelos de las demos, `qwen3:1.7b` para el texto y `qwen3-vl:2b-instruct` para la foto:

   ```sh
   npm run modelos
   ```

4. Opcional: consigue una clave de API de [TypeSafe](https://docs.typesafe.ai/api) para comparar con JEV.

<details>
<summary>Ollama aislado de la charla</summary>

Si existe el binario `~/.local/share/charla-jev/ollama/bin/ollama` (o el equivalente bajo `$XDG_DATA_HOME`), `npm start` y `npm run modelos` usan `start-ollama.sh` en lugar del Ollama del sistema. Ese script no hereda claves de proveedores ni toca la configuración global: deshabilita cloud, usa contexto 4096, mantiene un solo modelo cargado y guarda los modelos en `~/.local/share/charla-jev/models`.

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

Con `npm start` activo en el puerto 8000 y Chromium instalado:

```sh
npm test
```

Las pruebas usan proveedores simulados y servidores locales, así que no consumen créditos de JEV ni necesitan Ollama.

## Referencias

[API de TypeSafe](https://docs.typesafe.ai/api), [primitivas de JEV](https://docs.typesafe.ai/primitives), [salidas estructuradas de Ollama](https://docs.ollama.com/capabilities/structured-outputs), [imágenes en JEV](https://docs.typesafe.ai/images), [preguntas Box](https://docs.typesafe.ai/primitives/box), [modelo Qwen3 1.7B](https://ollama.com/library/qwen3:1.7b), [modelo Qwen3-VL](https://ollama.com/library/qwen3-vl).
