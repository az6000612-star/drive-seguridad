const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PUERTO = process.env.PORT || 3000;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Almacén de solicitudes activas
let solicitudes = {};

// Generar código aleatorio de 4 dígitos único
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

  // Mensaje que llega SOLO a tu WhatsApp
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
✅ Autorizar: LUZVERDE ${codigo}%0A
❌ Rechazar: LUZROJA ${codigo}`;

  res.json({
    exito: true,
    codigo: codigo,
    enlaceWhatsApp: `https://wa.me/593980530610?text=${mensaje}`
  });
});

// Consultar estado (lo revisa la app del conductor cada 3 segundos)
app.get('/estado/:codigo', (req, res) => {
  const cod = req.params.codigo;
  if (solicitudes[cod]) {
    res.json({ estado: solicitudes[cod].estado });
  } else {
    res.json({ estado: 'no_encontrado' });
  }
});

// Recibir respuesta de autorización
app.post('/respuesta', (req, res) => {
  const { codigo, decision } = req.body;
  if (solicitudes[codigo]) {
    solicitudes[codigo].estado = decision === 'verde' ? 'aprobado' : 'rechazado';
    res.json({ exito: true, mensaje: 'Estado actualizado' });
  } else {
    res.json({ exito: false, mensaje: 'Código no existe' });
  }
});

// Página de autorización para que TÚ des la luz desde cualquier celular
app.get("/autorizar", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <title>Autorización DRIVE</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          body { max-width: 420px; margin: 40px auto; padding: 20px; background: #f5f7fa; }
          h2 { text-align: center; color: #0F4C81; margin-bottom: 25px; }
          .caja { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          input { width: 100%; padding: 14px; font-size: 22px; text-align: center; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; letter-spacing: 4px; }
          .btn { width: 100%; padding: 15px; font-size: 18px; font-weight: bold; border: none; border-radius: 8px; margin: 8px 0; color: white; cursor: pointer; }
          .verde { background: #27AE60; }
          .rojo { background: #EB5757; }
        </style>
      </head>
      <body>
        <div class="caja">
          <h2>🔑 AUTORIZACIÓN DE VIAJE</h2>
          <input type="text" id="codigo" maxlength="4" placeholder="CÓDIGO 4 DÍGITOS">
          <button class="btn verde" onclick="autorizar('verde')">✅ LUZ VERDE</button>
          <button class="btn rojo" onclick="autorizar('rojo')">❌ LUZ ROJA</button>
          <p id="mensaje" style="text-align:center; margin-top:15px; font-weight:bold;"></p>
        </div>
        <script>
          const URL = window.location.origin;
          async function autorizar(tipo) {
            const cod = document.getElementById("codigo").value.trim();
            const mensaje = document.getElementById("mensaje");
            if (!cod || cod.length !== 4) {
              mensaje.textContent = "⚠️ Escribe un código de 4 dígitos";
              mensaje.style.color = "#EB5757";
              return;
            }
            try {
              const res = await fetch(URL + "/respuesta", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ codigo: cod, decision: tipo })
              });
              const datos = await res.json();
              if (datos.exito) {
                mensaje.textContent = "✅ Listo! La app ya se desbloqueó";
                mensaje.style.color = "#27AE60";
                document.getElementById("codigo").value = "";
              } else {
                mensaje.textContent = "❌ Código no encontrado";
                mensaje.style.color = "#EB5757";
              }
            } catch (e) {
              mensaje.textContent = "❌ Sin conexión";
              mensaje.style.color = "#EB5757";
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PUERTO, () => console.log('✅ SERVIDOR CORRIENDO CORRECTAMENTE'));
