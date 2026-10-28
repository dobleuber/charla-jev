// Speaker-ready, timed outline. Slides are editorial guidance, not claims of measured performance.
const JEV_DOCS = "https://docs.typesafe.ai/introduction/quickstart.md";
const PRIMITIVES = "https://docs.typesafe.ai/";
const GALLERY = "https://madewithjev.com/";
const KEV = "https://github.com/jaredpalmer/kev";
const LAYA = "https://brainfunctioncollapse.com/laya";

const agenda = [
  {
    "start": 0,
    "end": 2,
    "title": "01 · Pregunta inicial: ¿quién toma la decisión?",
    "visual": "Un ticket de soporte en pantalla; tres casillas vacías con las etiquetas Categoría, Frustración y Urgencia.",
    "speaker": "Un cliente dice que la compra lleva tres días fallando y que está perdiendo ventas. Un LLM podría escribir un párrafo empático, pero nuestra aplicación necesita decidir a dónde enrutar el ticket, si debe alertar a alguien y si debe esperar a una persona. Hoy hablamos de esa interfaz más acotada entre el juicio de un modelo y la acción del software, no de reemplazar todos los LLM ni de prometer que un veredicto de IA es automáticamente correcto. Este evento es MedellínJS; las dos comparaciones ejecutables y su backend están hechos en JavaScript sobre Node.js.",
    "points": [
      "Un mismo mensaje puede exigir varios juicios distintos.",
      "Una decisión solo se vuelve útil cuando el software sabe qué tiene permitido hacer con ella."
    ],
    "transition": "Antes de conocer a Jev, definamos la forma del problema."
  },
  {
    "start": 2,
    "end": 5,
    "title": "02 · El problema con forma de decisión",
    "visual": "Pipeline: estado desordenado → pregunta acotada → respuesta tipada → política de la aplicación → acción o revisión.",
    "speaker": "Un modelo de decisión toma el contexto relevante y responde una pregunta acotada en un formato que un programa puede inspeccionar. Piensen en el triaje, en encontrar una coincidencia en un catálogo o en marcar un mensaje para revisión. La entrada puede estar en lenguaje natural, pero la salida no es un ensayo. Un modelo mental útil es que el modelo aporta una evaluación, mientras que el código conserva la responsabilidad de la validación, los umbrales, los permisos, el registro y el efecto final. Mantengan visible esa distinción en cada ejemplo de hoy.",
    "points": [
      "El estado es evidencia, no una instrucción para ejecutar.",
      "Un juicio del modelo y una acción autorizada son cosas distintas.",
      "Adelanto: triaje de tickets, la extensión de cinco correos, la selección de candidatos y el traspaso a revisión."
    ],
    "transition": "Ahora podemos nombrar la interfaz concreta que expone Jev."
  },
  {
    "start": 5,
    "end": 8,
    "title": "03 · Conozcan a Jev: preguntas sobre un estado",
    "visual": "Solicitud a la izquierda: estado + preguntas tipadas. Respuesta a la derecha: respuestas + información de probabilidad.",
    "speaker": "Jev es el modelo de decisión alojado de TypeSafe AI. Le envías un estado y una o más preguntas tipadas; devuelve respuestas que tu código puede usar directamente, en lugar de generar prosa que tengas que parsear. Para esta charla, Jev está listo para llamarse sin entrenamiento específico para la tarea. La aplicación igual tiene que decidir qué preguntar y debe evaluar si las respuestas son lo bastante buenas para su propio caso de uso. Haremos tres preguntas distintas sobre el mismo estado antes de pasar a otros flujos de trabajo.",
    "points": [
      "Jev es un servicio alojado; usa la API documentada o el playground para probar una solicitud.",
      "Las definiciones de las preguntas y las opciones candidatas se pueden enviar en el momento de la solicitud.",
      "No se afirma que el modelo entienda la evidencia faltante ni que conozca por defecto la política de tu organización."
    ],
    "transition": "Desglosemos los tres tipos de pregunta antes de escribir una solicitud.",
    "sources": [
      {
        "label": "Guía de inicio rápido de TypeSafe",
        "url": "https://docs.typesafe.ai/introduction/quickstart.md"
      }
    ]
  },
  {
    "start": 8,
    "end": 12,
    "title": "04 · Tres primitivas: Choice, Score, Noul",
    "visual": "Tres tarjetas: '¿Qué categoría?' → Choice; '¿Qué tan frustrado?' → Score; '¿Necesita atención hoy?' → Noul.",
    "speaker": "Choice selecciona una opción con nombre y devuelve una distribución sobre las opciones, además de una confianza reportada. Score califica algo frente a niveles ordenados y descriptivos, y reporta un puntaje, una distribución y una confianza. Noul responde a un enunciado de tipo sí/no con un valor entre cero y uno; no lo confundas con una explicación generada ni asumas que tiene el mismo campo de confianza que Choice. Un número alto no prueba que una decisión sea segura. Usa una rúbrica clara, descripciones estables de los candidatos y reglas de negocio fuera del modelo.",
    "points": [
      "Choice: alternativas acotadas; incluye una opción explícita de revisión/ninguna cuando corresponda.",
      "Score: los niveles ordinales necesitan descripciones con sentido, no solo números sin explicación.",
      "Noul: un juicio de sí/no; distingue su valor de un riesgo operativo calibrado."
    ],
    "transition": "Esto se parece a la clasificación de toda la vida. ¿Qué cambia realmente?",
    "sources": [
      {
        "label": "Primitivas de TypeSafe",
        "url": "https://docs.typesafe.ai/"
      }
    ]
  },
  {
    "start": 12,
    "end": 15,
    "title": "05 · Lo que tiene en común con un clasificador tradicional",
    "visual": "La misma tarea —ticket → billing/technical/review— con un clasificador por tarea de un lado y preguntas tipadas de Jev del otro.",
    "speaker": "Un clasificador tradicional y Jev pueden resolver el mismo problema de enrutamiento. Ambos convierten evidencia en una decisión finita; ambos pueden equivocarse, ser sensibles a la distribución de entrenamiento y estar mal calibrados en los datos que realmente te importan. Un clasificador convencional suele construirse y evaluarse para un conjunto fijo de etiquetas. Lo interesante de Jev es que permite usar una interfaz de decisión general para especificar la pregunta y las opciones en el momento de la solicitud. Esa es una diferencia de flujo de trabajo, no una afirmación de que la clasificación se haya reinventado ni de que un clasificador específico para la tarea nunca pueda ser mejor.",
    "points": [
      "Base común: etiquetas finitas, análisis de errores, evaluación con datos reservados y umbrales operativos.",
      "Flujo distinto: un modelo fijo por tarea frente a un modelo reutilizable al que se le hace una pregunta tipada.",
      "Si unas reglas simples o un clasificador existente resuelven el problema de forma confiable, consérvalos."
    ],
    "transition": "¿Y si usáramos un modelo de lenguaje en su lugar?"
  },
  {
    "start": 15,
    "end": 18,
    "title": "06 · Lo que es —y lo que no es— frente a un LLM",
    "visual": "'Escribe una respuesta' junto a 'Devuelve una decisión tipada'; muestra que un LLM también puede producir salida estructurada.",
    "speaker": "Un LLM es especialmente útil cuando necesitamos redactar, explicar, resumir o razonar en una tarea abierta. También se le puede pedir que emita JSON; no finjamos que eso es imposible. Jev, en cambio, presenta juicios acotados como resultado directo de su API, con respuestas tipadas y distribuciones para el código de la aplicación. Un producto real puede combinarlos: usar una decisión para enrutar el ticket y un modelo generativo para redactar la respuesta. No se debe confiar en ninguno de los dos para otorgar acceso o ejecutar un reembolso solo porque devolvió una respuesta con apariencia de seguridad.",
    "points": [
      "Evita la falsa dicotomía: los LLM también pueden producir salidas estructuradas.",
      "Elige la interfaz según el trabajo; generación y decisión se complementan.",
      "Los permisos, la aritmética, los requisitos estrictos y los efectos irreversibles pertenecen a flujos deterministas o revisados."
    ],
    "transition": "Revisemos una solicitud completa y su respuesta de ejemplo preparada.",
    "sources": [
      {
        "label": "Guía de inicio rápido de TypeSafe",
        "url": "https://docs.typesafe.ai/introduction/quickstart.md"
      }
    ]
  },
  {
    "start": 18,
    "end": 22,
    "title": "07 · Demo 1, parte A: un ticket, tres preguntas tipadas",
    "visual": "Diapositivas 7–8 para el público: el estado del ticket y un único cuerpo POST con category, frustration y urgency.",
    "speaker": "Lee en voz alta el ticket de la diapositiva 7 y las tres preguntas que la aplicación necesita responder. En la diapositiva 8 recorre el extracto de la solicitud: un modelo, el ticket como state.ticket y las tres preguntas en el mismo mapa questions. category es un Choice entre billing, technical y review. frustration es un Score sobre tres niveles descritos, de tranquilo a muy enojado. urgency es un Noul que pregunta si el ticket necesita atención hoy. Estas preguntas comparten el estado, pero son juicios independientes. Las claves identifican las respuestas devueltas; las instrucciones dicen qué juzgar. Esta solicitud sigue la interfaz documentada de la API. Aquí no se ejecuta nada: anuncia que este mismo ticket se enviará en vivo en la diapositiva 11, después de dos simulaciones.",
    "points": [
      "Muestra un modelo, un estado y un mapa questions en una sola solicitud POST /v1/systemone.",
      "Las claves category, frustration y urgency son las mismas en la solicitud, en la respuesta y en el código que decide.",
      "Usa niveles de frustración descriptivos; Score puede quedar entre niveles. Noul da P(yes), no un grado de urgencia."
    ],
    "demo": {
      "input": "La compra lleva tres días fallando. Estamos perdiendo ventas. Estoy furioso. Por favor, ayúdennos hoy.",
      "reveal": "En la diapositiva 7, lee el ticket y las tres preguntas. En la diapositiva 8, señala en el extracto dónde va el ticket (state.ticket) y dónde va cada pregunta (questions). Todavía no hay respuesta: la verán en vivo en la diapositiva 11.",
      "caveat": "El extracto de la diapositiva 8 abrevia los criterios; la solicitud completa está en el código de referencia de abajo. No muestres resultados todavía."
    },
    "code": "// Solicitud completa como referencia. En vivo la envía el servidor desde la diapositiva 11.\nconst JEV_URL = \"https://api.typesafe.ai/v1/systemone\";\nconst request = {\n  \"model\": \"jev-latest\",\n  \"state\": {\n    \"ticket\": {\n      \"subject\": \"La compra no funciona\",\n      \"body\": \"La compra lleva tres días fallando. Estamos perdiendo ventas. Estoy furioso. Por favor, ayúdennos hoy.\"\n    }\n  },\n  \"questions\": {\n    \"category\": {\n      \"type\": \"choice\",\n      \"instructions\": \"¿Qué categoría describe mejor el problema de `ticket`?\",\n      \"criteria\": {\n        \"billing\": \"Cobros, reembolsos o pagos de suscripción\",\n        \"technical\": \"Errores de software o fallas de integración\",\n        \"review\": \"Responsabilidad poco clara; una persona debe aclarar el problema\"\n      }\n    },\n    \"frustration\": {\n      \"type\": \"score\",\n      \"instructions\": \"¿Qué tan frustrado suena el cliente en `ticket.body`?\",\n      \"criteria\": [\n        \"Tranquilo, solo describe hechos\",\n        \"Frustrado pero cordial\",\n        \"Muy enojado, usa expresiones intensas\"\n      ]\n    },\n    \"urgency\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿`ticket.body` describe un problema actual que necesita atención hoy?\"\n    }\n  }\n};\n\n// En el servidor, executeJev comprueba enableJev y la clave antes de enviar.\nconst raw = await providerJson(JEV_URL, request, { authorization: process.env.TYPESAFE_API_KEY });\nconst answers = validateJev(raw, request);\nconst decision = applicationResult(\"ticket\", answers, false, 0.5);",
    "transition": "Antes de ejecutar este ticket en vivo, veamos con dos simulaciones cómo el código convierte una respuesta acotada en una acción, empezando por elegir un candidato de una lista corta.",
    "sources": [
      {
        "label": "Tipos de pregunta combinados en TypeSafe",
        "url": "https://docs.typesafe.ai/primitives"
      },
      {
        "label": "Esquema de solicitud de TypeSafe",
        "url": "https://docs.typesafe.ai/api"
      }
    ]
  },
  {
    "start": 22,
    "end": 26,
    "title": "08 · Demo 2: búsqueda en lenguaje natural sobre candidatos",
    "visual": "Diapositiva 9: diagrama animado con la solicitud del comprador, la pregunta Choice, la respuesta preparada y la regla que elige qué anuncio mostrar o si ampliar la búsqueda.",
    "speaker": "Un comprador pide una bicicleta urbana de segunda mano, ligera, con portaequipaje y un presupuesto moderado. Tenemos tres descripciones cortas de publicaciones. Primero, preselecciona artículos candidatos con recuperación o filtros de base de datos comunes; luego pregúntale a Jev qué candidato cumple mejor la solicitud, o si ninguno lo hace. Es una selección acotada sobre evidencia suministrada, no una afirmación de que Jev recorra todo un marketplace o verifique mágicamente la información del vendedor. Los ejemplos de la galería ilustran la idea; sus costos y tiempos los reportan sus autores, no son mediciones nuestras.",
    "points": [
      "Muestra una coincidencia clara, una parcial, un artículo irrelevante y además 'ninguno'.",
      "La recuperación de candidatos y su vigencia ocurren fuera de Jev; este paso juzga una lista corta.",
      "Explica por qué una opción explícita de 'sin coincidencia' reduce las elecciones forzadas."
    ],
    "demo": {
      "input": "Solicitud: 'Bici urbana usada, ligera, portaequipaje, menos de €400.' Candidatos: A = usada, ligera, portaequipaje, €350; B = sin portaequipaje, €500; C = portaequipaje, €390, peso desconocido.",
      "reveal": "En la diapositiva 9 del público, reproduce Coincidencia descrita, luego cambia a Sin opción en presupuesto (la misma bici por menos de €300) y vuelve a reproducir. Los datos preparados cambian la respuesta de A a none. Son salidas ilustrativas, no mediciones en vivo de Jev. La recuperación y el filtrado exacto por precio se pueden hacer en código.",
      "caveat": "Las descripciones pueden estar incompletas o ser falsas; la elección no es evidencia de que el inventario, el peso o el precio se hayan verificado de forma independiente."
    },
    "code": "{\n  \"state\": {\n    \"request\": \"Bici urbana usada, ligera, portaequipaje, menos de €400\",\n    \"candidates\": [\n      {\"id\": \"A\", \"description\": \"Bicicleta urbana usada, portaequipaje, €350; anunciada como ligera\"},\n      {\"id\": \"B\", \"description\": \"Bicicleta de ruta, sin portaequipaje, €500\"},\n      {\"id\": \"C\", \"description\": \"Bicicleta urbana usada, portaequipaje, €390; peso no indicado\"}\n    ]\n  },\n  \"questions\": {\n    \"best_match\": {\n      \"type\": \"choice\",\n      \"instructions\": \"¿Qué candidato cumple mejor la solicitud usando solo hechos indicados?\",\n      \"criteria\": {\n        \"A\": \"Candidato A\", \"B\": \"Candidato B\", \"C\": \"Candidato C\",\n        \"none\": \"Ningún candidato tiene evidencia suficiente de coincidencia\"\n      }\n    }\n  }\n}\n// Añade \"model\": \"jev-latest\" al realizar la llamada real.",
    "transition": "Una tercera forma es decidir cuándo NO automatizar una decisión.",
    "sources": [
      {
        "label": "Galería Made with Jev (ejemplos reportados por sus autores)",
        "url": "https://madewithjev.com/"
      },
      {
        "label": "Choice de TypeSafe",
        "url": "https://docs.typesafe.ai/primitives/choice"
      }
    ]
  },
  {
    "start": 26,
    "end": 30,
    "title": "09 · Demo 3: traspaso a revisión, no aprobación automática",
    "visual": "Diapositiva 10: diagrama animado con el mensaje, la pregunta Noul, la respuesta preparada y la regla que elige entre revisar movimientos y pedir detalles; no hay reembolsos automáticos.",
    "speaker": "Toma un mensaje de un cliente que dice ver dos cobros del mismo pedido y pide que revisen uno. Haz una pregunta acotada: ¿el texto describe explícitamente un cobro duplicado? También puedes preguntar si al mensaje le falta información necesaria para la revisión. Jev puede ayudar a priorizar o marcar este caso; no puede comprobar el libro contable de pagos, verificar el derecho al reembolso ni autorizarlo. En un caso de alto impacto, la salida más interesante puede ser 'enviar a una persona'. Muestra también un seguimiento ambiguo, para que el público vea que abstenerse es un resultado de diseño normal, no una falla de la demo.",
    "points": [
      "Compara un reclamo claro con un mensaje vago de 'algo parece estar mal'.",
      "Usa Noul para la evidencia textual; verifica los datos de la cuenta y del pago con los sistemas que son fuente de verdad.",
      "Las reglas estrictas y los revisores deciden los reembolsos reales; la evaluación determina cualquier umbral de triaje automático."
    ],
    "demo": {
      "input": "Afirma un cobro duplicado: 'Veo dos cobros del pedido 4411. Por favor revisen uno.' Duda poco precisa: 'Mi último pago parece extraño. ¿Lo pueden revisar?'",
      "reveal": "En la diapositiva 10 del público, reproduce ambos casos. Primero llega un valor Noul preparado. Luego el código de la aplicación aplica un umbral de 0.8, explícitamente ilustrativo, para elegir entre revisar movimientos o pedir detalles. Este umbral no está calibrado para producción. La aplicación nunca emite un reembolso automático y no se muestra el razonamiento interno del modelo.",
      "caveat": "No confundas un reclamo en un mensaje con una verificación contra los registros de pago. No emitas reembolsos a partir de esta respuesta."
    },
    "code": "{\n  \"model\": \"jev-latest\",\n  \"state\": {\"message\": \"Veo dos cobros del pedido 4411. Por favor revisen uno.\"},\n  \"questions\": {\n    \"duplicate_claim\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El texto afirma que hubo un cobro duplicado?\"\n    }\n  }\n}\n// Regla de la aplicación: noul ≥ 0.8 → revisar movimientos; si no → pedir detalles. Ninguna regla emite reembolsos.",
    "transition": "Basta de simulaciones: volvamos al ticket del principio y ejecutémoslo en vivo contra JEV y un LLM local.",
    "sources": [
      {
        "label": "Guía de inicio rápido de TypeSafe",
        "url": "https://docs.typesafe.ai/introduction/quickstart.md"
      }
    ]
  },
  {
    "start": 30,
    "end": 34,
    "title": "10 · Demo 1 en vivo: una respuesta, tres decisiones en código",
    "visual": "Diapositiva 11: enlace a la página de ticket con editor, estados HTTP y resultados reales lado a lado.",
    "speaker": "Abre la demo del ticket desde la diapositiva 11. Lee el ejemplo Problema claro y urgente y la rúbrica. Pulsa Ejecutar una sola vez: cada proveedor recibe la misma evidencia y las tres preguntas. Observa cuándo inicia HTTP y cómo la espera animada continúa hasta recibir la respuesta final; los eventos no muestran pasos internos del modelo. Compara la categoría, el Score ponderado y Noul de JEV con la categoría, el nivel ordinal y el booleano del LLM. Muestra las reglas debajo de cada resultado: confianza menor que 0,7 lleva a revisión; urgencia de JEV al menos 0,8 prioriza; Score al menos 1,5 asigna responsable. Estas reglas son didácticas. Cambia a Mensaje poco preciso o edita la evidencia para explicar cómo se construye otra entrada; una nueva ejecución consume otra petición por proveedor. Para MedellínJS, pulsa Ver código: muestra la solicitud exacta, el JSON Schema y las funciones de Node.js que se ejecutaron, con fetch nativo, async/await, validación y reglas de aplicación en JavaScript plano, sin SDK. La estructura válida no garantiza acierto. Los ejemplos numéricos del código de estas notas son ilustrativos y no sustituyen los resultados reales.",
    "points": [
      "Compara las tres respuestas de cada proveedor cuando llegan; dentro de un proveedor llegan en una única respuesta.",
      "La categoría determina el enrutamiento; la urgencia fija la prioridad; la frustración cambia el seguimiento. La aplicación es dueña de estos efectos.",
      "El umbral de confianza de 0.7, el de urgencia de 0.8 y el de frustración de 1.5 son una política didáctica, no configuraciones validadas para producción.",
      "Comparación en vivo opcional: el LLM devuelve un nivel ordinal de frustración y una urgencia booleana, no probabilidades ni confianza de Jev. Muestra por separado las salidas crudas y validadas, el modelo/digest, el tiempo de reloj HTTP y los tiempos locales de carga/prompt/generación."
    ],
    "demo": {
      "input": "En demos.html#ticket elige Problema claro y urgente, Mensaje poco preciso o Cobro que necesita revisión; puedes editar asunto y contenido.",
      "reveal": "Abre demos.html y observa la entrada compartida, el inicio HTTP, la espera, la respuesta final y la validación. Los contadores no incluyen consultas de disponibilidad. El cronómetro muestra tiempo transcurrido real; cada modelo entrega una respuesta final, no tokens en streaming.",
      "caveat": "Los resultados de la página son reales; los extractos de código de estas notas son ilustrativos. La confianza reportada no es precisión observada y aquí no se enruta un ticket externo."
    },
    "code": "// Respuestas ilustrativas; se omiten modelo y consumo.\n// Caso: cliente frustrado y urgente\nconst response = {\n  \"answers\": {\n    \"category\": {\n      \"type\": \"choice\",\n      \"choice\": \"technical\",\n      \"probabilities\": {\n        \"billing\": 0.03,\n        \"technical\": 0.9,\n        \"review\": 0.07\n      },\n      \"confidence\": 0.85\n    },\n    \"frustration\": {\n      \"type\": \"score\",\n      \"score\": 1.8,\n      \"probabilities\": {\n        \"0\": 0,\n        \"1\": 0.2,\n        \"2\": 0.8\n      },\n      \"confidence\": 0.7,\n      \"legend\": {\n        \"0\": \"Tranquilo, solo describe hechos\",\n        \"1\": \"Frustrado pero cordial\",\n        \"2\": \"Muy enojado, usa expresiones intensas\"\n      }\n    },\n    \"urgency\": {\n      \"type\": \"noul\",\n      \"noul\": 0.98\n    }\n  }\n};\n\n// Caso: queja tranquila y poco precisa\nconst calmResponse = {\n  \"answers\": {\n    \"category\": {\n      \"type\": \"choice\",\n      \"choice\": \"review\",\n      \"probabilities\": {\n        \"billing\": 0.2,\n        \"technical\": 0.2,\n        \"review\": 0.6\n      },\n      \"confidence\": 0.4\n    },\n    \"frustration\": {\n      \"type\": \"score\",\n      \"score\": 0.35,\n      \"probabilities\": {\n        \"0\": 0.65,\n        \"1\": 0.35,\n        \"2\": 0\n      },\n      \"confidence\": 0.475,\n      \"legend\": {\n        \"0\": \"Tranquilo, solo describe hechos\",\n        \"1\": \"Frustrado pero cordial\",\n        \"2\": \"Muy enojado, usa expresiones intensas\"\n      }\n    },\n    \"urgency\": {\n      \"type\": \"noul\",\n      \"noul\": 0.25\n    }\n  }\n};\n\n// Política didáctica: solicita revisión; no ejecuta acciones externas.\nfunction routeTicket(response) {\nif (!response?.answers) return sendToHumanQueue();\nconst a = response.answers;\nif (!validTicketAnswers(a)) return sendToHumanQueue();\nconst queue = a.category.choice === \"review\" || a.category.confidence < 0.7\n  ? \"human\" : a.category.choice;\nconst priority = a.urgency.noul >= 0.8 ? \"priority_review\" : \"routine_review\";\nconst followup = a.frustration.score >= 1.5 ? \"assign_owner\" : \"normal_followup\";\n// Tu aplicación usa queue, priority y followup; JEV no ejecuta acciones.\n  return { queue, priority, followup };\n}",
    "transition": "Ahora mantén una sola solicitud, pero haz que su estado sea una colección de cinco correos.",
    "sources": [
      {
        "label": "Forma de la respuesta de TypeSafe",
        "url": "https://docs.typesafe.ai/introduction/quickstart"
      },
      {
        "label": "Niveles de Score y puntaje ponderado",
        "url": "https://docs.typesafe.ai/primitives/score"
      }
    ]
  },
  {
    "start": 34,
    "end": 36,
    "title": "11 · Extensión de correo, parte A: cinco correos en un estado",
    "visual": "Diapositiva 12 para el público: cinco correos sintéticos identificados a la izquierda; las cinco preguntas Noul y sus rutas objetivo a la derecha.",
    "speaker": "Es el mismo patrón de API de estado más preguntas, aplicado a una colección. Construye un objeto de estado con emails.e01 a emails.e05. Luego define cinco preguntas Noul en un mismo mapa questions. Cada pregunta tiene una instrucción que nombra explícitamente su ruta objetivo, por ejemplo emails.e01. Una clave como spam_e01 por sí sola no basta: los IDs de pregunta son para el código y no se envían al modelo. Las cinco preguntas ven todo el estado compartido, así que las instrucciones indican juzgar solo el correo nombrado. Envía todo este payload en un solo POST. Esto respalda el patrón; no garantiza que un modelo nunca confunda entradas ni que aumentar el tamaño del lote salga gratis. Para MedellínJS, muestra la implementación en Node.js: fetch nativo, async/await, validación y reglas de aplicación en JavaScript plano. No se necesita ningún SDK. Ver código muestra las funciones del módulo JavaScript en ejecución. La ejecución real ahora está en demos.html: abre la comparación desde las diapositivas 11 o 13, edita la evidencia y pulsa Ejecutar. Los estados provienen de eventos HTTP y validación, no de pasos internos. Cada proveedor recibe una petición con todas sus preguntas.",
    "points": [
      "Un estado contiene los cinco correos identificados; un mapa questions contiene exactamente cinco preguntas Noul.",
      "Cada instrucción nombra explícitamente la ruta de su propio correo, en lugar de depender del ID de la pregunta.",
      "Usa solo asuntos y cuerpos sintéticos. Esta colección no es un conjunto de cinco solicitudes concurrentes.",
      "Ver código muestra el mismo estado de cinco correos y los mismos criterios enviados a ambos proveedores; el parámetro format de Ollama es un JSON Schema real, no un prompt que pide JSON."
    ],
    "demo": {
      "input": "e01 oferta de premio; e02 invitación a almorzar; e03 solicitud de credenciales; e04 oferta de servicio no solicitada; e05 notas del proyecto que se pidieron.",
      "reveal": "Abre demos.html y observa la entrada compartida, el inicio HTTP, la espera, la respuesta final y la validación. Los contadores no incluyen consultas de disponibilidad. El cronómetro muestra tiempo transcurrido real; cada modelo entrega una respuesta final, no tokens en streaming.",
      "caveat": "Todas las preguntas comparten el estado. Evalúa la interferencia y los límites de entrada con cargas de trabajo reales; no se afirman ahorros medidos ni capacidad de lote ilimitada."
    },
    "code": "// Funciones Node.js que muestra Ver código. JEV de pago requiere habilitación explícita.\nconst JEV_URL = \"https://api.typesafe.ai/v1/systemone\";\nconst request = {\n  \"model\": \"jev-latest\",\n  \"state\": {\n    \"emails\": {\n      \"e01\": {\n        \"subject\": \"¡Ganaste un bono!\",\n        \"body\": \"Premio no solicitado: reclama un bono de un concurso en el que no participaste. Primero paga una tarifa.\"\n      },\n      \"e02\": {\n        \"subject\": \"¿Almorzamos mañana?\",\n        \"body\": \"Como hablamos, ¿nos vemos a almorzar mañana al mediodía?\"\n      },\n      \"e03\": {\n        \"subject\": \"Aviso sobre tu cuenta\",\n        \"body\": \"Aviso no solicitado: cerraremos tu cuenta. Envía tu contraseña para verificar el acceso de inmediato.\"\n      },\n      \"e04\": {\n        \"subject\": \"Oferta de servicio no solicitada\",\n        \"body\": \"Encontramos tu sitio y queremos ofrecerte un rediseño. ¿Podemos enviarte una cotización?\"\n      },\n      \"e05\": {\n        \"subject\": \"Notas del proyecto solicitadas\",\n        \"body\": \"Aquí están las notas del proyecto que me pediste después de nuestra reunión.\"\n      }\n    }\n  },\n  \"questions\": {\n    \"spam_e01\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El correo en `emails.e01` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.\"\n    },\n    \"spam_e02\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El correo en `emails.e02` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.\"\n    },\n    \"spam_e03\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El correo en `emails.e03` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.\"\n    },\n    \"spam_e04\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El correo en `emails.e04` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.\"\n    },\n    \"spam_e05\": {\n      \"type\": \"noul\",\n      \"instructions\": \"¿El correo en `emails.e05` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.\"\n    }\n  }\n};\n\n// En el servidor, executeJev comprueba enableJev y la clave antes de enviar.\nconst raw = await providerJson(JEV_URL, request, { authorization: process.env.TYPESAFE_API_KEY });\nconst answers = validateJev(raw, request);\nconst decision = applicationResult(\"mail\", answers, false, 0.5);",
    "transition": "La respuesta contiene cinco probabilidades; agrupar esos correos es código de aplicación común y corriente.",
    "sources": [
      {
        "label": "Rutas de estado explícitas en TypeSafe",
        "url": "https://docs.typesafe.ai/primitives#reference-specific-fields"
      },
      {
        "label": "Estado estructurado",
        "url": "https://docs.typesafe.ai/concepts/state"
      },
      {
        "label": "Rutas de campo explícitas e IDs de pregunta",
        "url": "https://docs.typesafe.ai/primitives"
      }
    ]
  },
  {
    "start": 36,
    "end": 40,
    "title": "12 · Extensión de correo, parte B: cinco respuestas, dos grupos",
    "visual": "Diapositiva 13: enlace a la página de cinco correos; una petición por proveedor, grupos derivados de la respuesta real y corte editable.",
    "speaker": "Abre demos.html#correos desde la diapositiva 13. Lee los cinco mensajes y las instrucciones que nombran emails.e01 a emails.e05. Ejecuta una sola vez y observa las cinco respuestas que llegan juntas por proveedor. JEV entrega P(spam) y el LLM entrega cinco booleanos; conserva sus desacuerdos. Después cambia el corte de JEV entre 0,50 y 0,80: el navegador reagrupa la misma respuesta recibida y muestra el corte aplicado, sin enviar otra evaluación. No prometas que un correo concreto cambiará de grupo: eso depende de la probabilidad real devuelta. El contador debe mantenerse igual al cambiar el corte. El grupo No spam significa por debajo del corte, no legitimidad verificada. Muestra Ver código JS para revisar la solicitud exacta y JSON Schema. Una nueva ejecución, en cambio, sí solicita otra respuesta y puede consumir créditos. Los valores de ejemplo del código en estas notas son ilustrativos; la página conserva respuestas reales y errores, sin reemplazarlos con datos preparados.",
    "points": [
      "Las cinco respuestas vuelven bajo las cinco claves de pregunta enviadas, en una sola respuesta.",
      "El código usa >= de forma consistente: una probabilidad exactamente igual al umbral va a Spam.",
      "No metas en silencio respuestas faltantes o mal formadas en No spam; la validación va antes de agrupar.",
      "Un proveedor que falla se queda como error; no se sustituyen probabilidades preparadas. Una sola muestra cronometrada no es un benchmark general."
    ],
    "demo": {
      "input": "Los mismos cinco correos sintéticos de la diapositiva de la solicitud; umbrales de ejemplo de 0.50 y 0.80.",
      "reveal": "Abre demos.html y observa la entrada compartida, el inicio HTTP, la espera, la respuesta final y la validación. Los contadores no incluyen consultas de disponibilidad. El cronómetro muestra tiempo transcurrido real; cada modelo entrega una respuesta final, no tokens en streaming.",
      "caveat": "La página realiza llamadas reales. Los valores del extracto en estas notas son ilustrativos y el corte no está calibrado para producción. Dos casos no demuestran precisión, velocidad ni ahorro generales."
    },
    "code": "// Respuesta ilustrativa; se omiten modelo y consumo.\nconst response = {\n  \"answers\": {\n    \"spam_e01\": {\n      \"type\": \"noul\",\n      \"noul\": 0.98\n    },\n    \"spam_e02\": {\n      \"type\": \"noul\",\n      \"noul\": 0.04\n    },\n    \"spam_e03\": {\n      \"type\": \"noul\",\n      \"noul\": 0.96\n    },\n    \"spam_e04\": {\n      \"type\": \"noul\",\n      \"noul\": 0.55\n    },\n    \"spam_e05\": {\n      \"type\": \"noul\",\n      \"noul\": 0.08\n    }\n  }\n};\n\nconst threshold = 0.5; // ejemplo didáctico; política sin validar\nconst groups = { spam: [], notSpam: [] };\nfor (const id of Object.keys(request.state.emails)) {\n  const a = response.answers[\"spam_\" + id];\n  if (a?.type !== \"noul\" || !Number.isFinite(a.noul) || a.noul < 0 || a.noul > 1)\n    throw new Error(\"Revisar respuesta ausente o inválida de \" + id);\n  groups[a.noul >= threshold ? \"spam\" : \"notSpam\"].push(id);\n}\n// Con corte 0,50: spam=[e01,e03,e04]; notSpam=[e02,e05]\n// Con corte 0,80: spam=[e01,e03]; notSpam=[e02,e04,e05]",
    "transition": "Ya vimos respuestas reales, con sus coincidencias y desacuerdos; ahora separemos qué es realmente nuevo y qué no.",
    "sources": [
      {
        "label": "Varias preguntas en una solicitud",
        "url": "https://docs.typesafe.ai/primitives"
      },
      {
        "label": "Cómo leer Noul y elegir umbrales",
        "url": "https://docs.typesafe.ai/primitives/noul"
      }
    ]
  },
  {
    "start": 40,
    "end": 43,
    "title": "13 · ¿Qué es realmente nuevo aquí?",
    "visual": "Resalta el contrato reutilizable: estado + preguntas tipadas → resultados estructurados; anota 'no es una nueva definición de clasificación'.",
    "speaker": "Lo novedoso y útil no es que las máquinas puedan clasificar tickets; llevan años haciéndolo. El cambio está en la ergonomía de una interfaz de decisión general: definir juicios pequeños y tipados en el momento de la solicitud, hacer varias preguntas relacionadas sobre el mismo estado y componer las respuestas en código. Esto permite experimentar rápido con nuevos flujos de trabajo sin construir un modelo entrenado aparte para cada conjunto de etiquetas. Esa comodidad no reemplaza la evaluación específica de la tarea ni garantiza una calibración confiable.",
    "points": [
      "Habla del contrato de software, no de nombres comerciales ni de multiplicadores de rendimiento sin respaldo.",
      "Las preguntas atómicas se componen en un flujo de trabajo en código.",
      "Separa las afirmaciones de usabilidad y velocidad de la calidad medida en tu propia tarea."
    ],
    "transition": "Entonces, ¿qué nos impediría llevar esto a producción mañana?",
    "sources": [
      {
        "label": "Documentación de TypeSafe",
        "url": "https://docs.typesafe.ai/"
      }
    ]
  },
  {
    "start": 43,
    "end": 46,
    "title": "14 · Limitaciones, modos de falla y evaluación",
    "visual": "Lista de verificación con cuatro riesgos: evidencia faltante; redacción de las opciones; incertidumbre calibrada; fallas operativas.",
    "speaker": "Primero, un modelo no puede verificar hechos que no recibió: los campos faltantes y los detalles de producto inventados siguen siendo un problema. Segundo, la redacción y el conjunto de candidatos afectan las elecciones. Tercero, una probabilidad o una confianza reportada no es un SLA listo para usar; prueba con casos etiquetados representativos y examina falsos positivos, falsos negativos, calibración y cobertura en el umbral de revisión que elijas. Por último, ten en cuenta la latencia, el precio, el manejo de datos, las caídas del proveedor y los cambios de versión del modelo. Documenta una ruta a prueba de fallas y revisa los errores después del lanzamiento.",
    "points": [
      "Usa ejemplos reservados del flujo de trabajo real, incluidos casos ambiguos y fuera de distribución.",
      "Revisa la precisión y cuáles errores salen caros; evalúa confianza/cobertura antes de automatizar.",
      "Registra la versión del modelo y las entradas de forma adecuada; la privacidad y el enmascaramiento de datos importan."
    ],
    "transition": "Esas necesidades operativas también influyen en qué modelo de despliegue tiene sentido."
  },
  {
    "start": 46,
    "end": 48,
    "title": "15 · Más proveedores y otras formas de ser dueño de la capa de decisión",
    "visual": "Dos columnas: servicios alojados (Jev, OpenAI Decisions API, Microsoft-Decision-1) y rutas con pesos abiertos o autogestionadas (Cloudflare Clef y Clef-flash, KEV, Laya), sin tabla de ranking.",
    "speaker": "Jev nos sirvió como camino alojado para esta charla, pero ya no está solo. En octubre de 2026 OpenAI abrió en beta pública su Decisions API, con preguntas choice, score y predicate sobre texto o imágenes; Microsoft publicó Microsoft-Decision-1 en Foundry, en preview, que devuelve una probabilidad por opción; y Cloudflare lanzó Clef y Clef-flash, con pesos abiertos bajo Apache 2.0, alojados en Workers AI y, según Cloudflare, compatibles con la API de Jev. Si una API externa cerrada no es aceptable, Clef, KEV y Laya ofrecen rutas para ejecutar modelos de decisión bajo tu propio control. Ese control también implica encargarse del cómputo, el serving, las actualizaciones, la evaluación y, cuando la tarea lo requiera, la adaptación con ejemplos etiquetados. Hoy no vamos a comparar sus puntajes: las cifras de velocidad y precisión que publica cada proveedor son propias y no las medimos aquí. Esta hora es para entender el patrón de los modelos de decisión, que ahora ofrecen varios proveedores.",
    "points": [
      "Que varios proveedores ofrezcan la misma forma de pregunta (choice, score, probabilidad) confirma el patrón, no que sus resultados sean equivalentes.",
      "Las cifras de velocidad y precisión de los anuncios son del propio proveedor; evalúa con tus casos antes de cambiar de proveedor.",
      "Abierto/local no significa automáticamente fácil, seguro ni gratis.",
      "Estados de octubre de 2026: OpenAI en beta pública y Microsoft en preview; revisa la disponibilidad antes de la charla."
    ],
    "transition": "Terminemos con una guía sencilla sobre cuándo este patrón tiene lugar en un sistema.",
    "sources": [
      {
        "label": "OpenAI Decisions API",
        "url": "https://developers.openai.com/api/docs/guides/decisions"
      },
      {
        "label": "Cloudflare Clef",
        "url": "https://blog.cloudflare.com/clef-decision-models/"
      },
      {
        "label": "Microsoft-Decision-1",
        "url": "https://ai.azure.com/catalog/models/Microsoft-Decision-1"
      },
      {
        "label": "Repositorio de KEV",
        "url": "https://github.com/jaredpalmer/kev"
      },
      {
        "label": "Proyecto Laya",
        "url": "https://brainfunctioncollapse.com/laya"
      }
    ]
  },
  {
    "start": 48,
    "end": 50,
    "title": "16 · Cuándo usarlo: un árbol de decisión para cerrar",
    "visual": "¿Necesitas un juicio acotado? → modelo de decisión. ¿Necesitas prosa? → LLM. ¿Regla exacta? → código. ¿Mucho en juego? → proceso humano/verificado.",
    "speaker": "Usa un modelo de decisión cuando una aplicación necesita un juicio acotado y repetido sobre evidencia compleja y puede revisar su salida antes de actuar. Usa un clasificador convencional específico para la tarea si la estabilidad de la tarea, los datos, el costo y la evaluación lo hacen más adecuado. Usa un LLM para generación o razonamiento abierto, y código para políticas exactas. En flujos de riesgo, la salida correcta suele ser una recomendación para un revisor. Cierra retomando el ticket del inicio: la máquina puede juzgar quién debería mirarlo primero; la responsabilidad de lo que pasa después sigue siendo del sistema que diseñamos.",
    "points": [
      "Los modelos de decisión son una interfaz de software útil, no un reemplazo de todas las demás técnicas.",
      "Mantén una ruta para la incertidumbre, la evidencia faltante y las fallas del modelo o de la API.",
      "Invita a hacer preguntas sobre flujos de trabajo reales que el público quiera probar."
    ],
    "transition": "Abre el espacio a preguntas; si no hay, retoma un caso ambiguo de las demos."
  },
  {
    "start": 50,
    "end": 60,
    "title": "17 · Preguntas, objeciones y preguntas de respaldo opcionales",
    "visual": "Vuelve al ticket y a la colección de correos. Usa los dos patrones de solicitud para abrir la discusión.",
    "speaker": "Deja diez minutos para preguntas en lugar de llenar la hora con más diapositivas. Si la discusión arranca lenta, pregunta qué decisiones en los propios sistemas del público son lo bastante acotadas para exponerse como preguntas tipadas, cuáles necesitan datos de fuentes autorizadas más allá del texto y qué error saldría más caro. Si alguien pregunta por el control local, menciona KEV y Laya como posibles rumbos prácticos a futuro. No improvises comparaciones de rendimiento ni afirmaciones sobre entrenamiento sin respaldo; las fuentes primarias enlazadas sirven para hacer seguimiento.",
    "points": [
      "¿Qué decisión NO permitirías que un modelo automatizara?",
      "¿Dónde mejoraría el producto una ruta de abstención o revisión?",
      "¿Qué datos podrías recopilar para evaluar esa ruta de forma responsable?"
    ],
    "transition": "Cierre: el modelo emite un juicio; el equipo de producto decide qué puede hacer ese juicio.",
    "sources": [
      {
        "label": "Documentación de TypeSafe",
        "url": "https://docs.typesafe.ai/"
      },
      {
        "label": "KEV",
        "url": "https://github.com/jaredpalmer/kev"
      },
      {
        "label": "Laya",
        "url": "https://brainfunctioncollapse.com/laya"
      }
    ]
  }
];

function formatTime(minutes) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
function totalMinutes(slides) {
  return slides.reduce((sum, slide) => sum + slide.end - slide.start, 0);
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function renderAgenda(slides) {
  return slides.map((slide, index) => {
    const points = slide.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    const demo = slide.demo ? `<section class="demo" aria-label="Guía de la demo">
      <h4>Guía de la demo</h4>
      <p><strong>Entrada:</strong> ${escapeHtml(slide.demo.input)}</p>
      <p><strong>Qué mostrar:</strong> ${escapeHtml(slide.demo.reveal)}</p>
      <p><strong>No afirmar:</strong> ${escapeHtml(slide.demo.caveat)}</p>
    </section>` : "";
    const code = slide.code ? `<h4>Código de referencia (no se proyecta)</h4><pre><code>${escapeHtml(slide.code)}</code></pre>` : "";
    const sources = slide.sources?.length ? `<p class="sources"><strong>Fuentes:</strong> ${slide.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`).join(" · ")}</p>` : "";
    return `<article class="agenda-card" id="slide-${index + 1}">
      <div class="agenda-time"><span>${formatTime(slide.start)}–${formatTime(slide.end)}</span><span>${slide.end - slide.start} min · Diapositiva ${index === 6 ? "7–8" : index === 16 ? "17 · preguntas" : index >= 7 ? index + 2 : index + 1}</span></div>
      <div class="agenda-content"><h3>${escapeHtml(slide.title)}</h3><p class="visual"><strong>En pantalla:</strong> ${escapeHtml(slide.visual)}</p>
        <details open><summary>Notas y puntos para conversar</summary>
          <h4>Notas</h4><p class="speaker">${escapeHtml(slide.speaker)}</p>
          <h4>Ideas clave</h4><ul>${points}</ul>${demo}${code}
          <p class="transition"><strong>Transición:</strong> ${escapeHtml(slide.transition)}</p>${sources}
        </details>
      </div>
    </article>`;
  }).join("\n");
}

if (typeof document !== "undefined") {
  const container = document.getElementById("agenda");
  if (container) container.innerHTML = renderAgenda(agenda);
  const duration = document.getElementById("duration-summary");
  if (duration) duration.textContent = `${agenda.length} diapositivas · ${totalMinutes(agenda)} minutos con preguntas · notas abiertas`;
  document.getElementById("print-outline")?.addEventListener("click", () => window.print());
  document.getElementById("toggle-notes")?.addEventListener("click", (event) => {
    const notes = [...document.querySelectorAll("#agenda details")];
    const open = notes.some((note) => !note.open);
    notes.forEach((note) => { note.open = open; });
    event.currentTarget.textContent = open ? "Contraer notas" : "Abrir notas";
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { agenda, escapeHtml, formatTime, renderAgenda, totalMinutes };
}
