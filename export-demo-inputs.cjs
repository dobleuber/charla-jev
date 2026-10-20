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
// Reclamo con foto: las mismas preguntas sobre tres fotos. Las imágenes viven en fotos/
// y el servidor las adjunta a ambas peticiones; Box requiere Jev 1.14.
const PHOTO_REF = 'foto-reclamo-7c1e';
const photoClaim = { subject: 'El paquete llegó dañado', body: 'Recibí el pedido con una esquina de la caja hundida y rota. Adjunto una foto. Quiero que me envíen otro.' };
function photoRequest(file) {
  return {
    model: 'jev-1.14.0',
    state: { reclamo: structuredClone(photoClaim), foto: PHOTO_REF },
    assets: { [PHOTO_REF]: { type: 'image', file } },
    questions: {
      danio_visible: { type: 'noul', instructions: '¿La imagen en `foto` muestra daño visible en el paquete o en el producto?' },
      tipo_danio: { type: 'choice', instructions: '¿Qué daño se ve en la imagen de `foto`?', criteria: { caja: 'Daño en la caja o el empaque', producto: 'Daño en el producto', no_visible: 'No se ve daño en la foto' } },
      coincide_con_reclamo: { type: 'noul', instructions: '¿Lo que muestra la imagen en `foto` coincide con el daño que describe `reclamo.body`?' },
      ubicacion_danio: { type: 'box', instructions: 'el daño más visible en la imagen de `foto`' },
    },
  };
}
catalog.photo = { damaged: photoRequest('fotos/caja-golpeada.jpg'), intact: photoRequest('fotos/caja-intacta.jpg'), slight: photoRequest('fotos/caja-dano-leve.jpg') };
fs.writeFileSync(path.join(__dirname, 'demo-inputs.json'), JSON.stringify(catalog, null, 2) + '\n');
