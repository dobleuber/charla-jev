// Generate the backend catalog from the same builders used by the slides.
const fs = require('node:fs');
const path = require('node:path');
const D = require('./single-request.js');
const catalog = {
  ticket: { clear: D.buildTicketRequest(), ambiguous: D.buildTicketRequest('ambiguous') },
  mail: { clear: D.buildMailRequest() },
};
catalog.ticket.billing = structuredClone(catalog.ticket.ambiguous);
catalog.ticket.billing.state.ticket = {
  subject: 'Un cobro que no reconozco',
  body: 'Veo dos cobros parecidos en el extracto, pero no sé si uno es una preautorización. ¿Pueden revisarlo esta semana?',
};
catalog.mail.ambiguous = structuredClone(catalog.mail.clear);
catalog.mail.ambiguous.state.emails = {
  e01: { subject: 'El boletín de esta semana', body: 'Te enviamos novedades de nuestro producto. No recuerdas si te suscribiste hace meses.' },
  e02: { subject: 'Propuesta para tu equipo', body: 'Hola, nos conocimos en un evento. Quería compartir una propuesta comercial; dime si no te interesa.' },
  e03: { subject: 'Actividad en tu cuenta', body: 'Detectamos un acceso. Abre el portal que usas habitualmente para revisar los movimientos. No respondas con datos.' },
  e04: { subject: 'Descuento disponible', body: 'Esta semana ofrecemos un descuento en servicios. No consta una conversación previa.' },
  e05: { subject: 'Seguimiento de la reunión', body: 'Gracias por la reunión del lunes. Te comparto el resumen acordado y las preguntas pendientes.' },
};
fs.writeFileSync(path.join(__dirname, 'demo-inputs.json'), JSON.stringify(catalog, null, 2) + '\n');
