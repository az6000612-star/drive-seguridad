const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacén de solicitudes
let solicitudes = {};

// Generar código de 4 dígitos
function generarCodigoCorto() {
  let codigo;
  do {
    codigo = Math.floor(1000 + Math.random() * 9000).toString();
  } while (solicitudes[codigo]);
  return codigo;
}

// Recibir solicitud del conductor
app.post('/enviar-solicitud', (req, res) => {
  const datos = req.body;
  const codigo = generarCodigoCorto();

  solicitudes[codigo] = {
    ...datos,
    estado: 'pendiente',
    fecha: new Date().toLocaleString('es-EC')
  };

  // Mensaje que te llega A TI con el código de 4 dígitos
  const mensaje = `*📋 SOLICITUD DE SALIDA*%0A
📅 Fecha: ${solicitudes[codigo].fecha}%0A
👤 Conductor: ${datos.conductor}%0A
🚗 Placa: ${datos.placa} | Tipo: ${datos.tipoVeh}%0A
📍 Ruta: ${datos.inicio} ➜ ${datos.destino}%0A
%0A🔍 REVISIÓN%0A
✅ Vehículo: ${datos.revVeh}%0A
✅ Equipo: ${datos.revEquipo}%0A
✅ Descanso: ${datos.revDescanso}%0A
✅ Documentos: ${datos.revDoc}%0A
%0A📝 Observaciones: ${datos.observaciones || 'Sin observaciones'}%0A
%0A---%0A
*CÓDIGO: ${codigo}*%0A
✅ RESPONDE: LUZVERDE ${codigo} → Autorizar%0A
❌ RESPONDE: LUZROJA ${codigo} → Rechazar`;

  res.json({
    exito: true,
    codigo: codigo,
    enlaceWhatsApp: `https://wa.me/593980530610?text=${mensaje}`
  });
});

// Consultar estado de la solicitud (lo revisa la app del conductor)
app.get('/estado/:codigo', (req, res) => {
  const cod = req.params.codigo;
  if (solicitudes[cod]) {
    res.json({ estado: solicitudes[cod].estado });
  } else {
    res.json({ estado: 'no_encontrado' });
  }
});

// Ruta para que tu respuesta de WhatsApp llegue al sistema
app.post('/respuesta', (req, res) => {
  const { codigo, decision } = req.body;
  if (solicitudes[codigo]) {
    solicitudes[codigo].estado = decision === 'verde' ? 'aprobado' : 'rechazado';
    res.json({ exito: true });
  } else {
    res.json({ exito: false, mensaje: 'Código no existe' });
  }
});

app.listen(PUERTO, () => console.log('✅ Servidor listo - Códigos de 4 dígitos'));
