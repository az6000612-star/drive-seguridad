const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PUERTO = process.env.PORT || 3000;

// Configuración segura y abierta
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Almacén de solicitudes
let solicitudes = {};

// Generar código de 4 dígitos único
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
    estado: "pendiente",
    fecha: new Date().toLocaleString("es-EC")
  };

  const mensaje = `*📋 SOLICITUD DE SALIDA*%0A
📅 Fecha: ${solicitudes[codigo].fecha}%0A
👤 Conductor: ${datos.conductor}%0A
🚗 Placa: ${datos.placa} | ${datos.tipoVeh}%0A
📍 Ruta: ${datos.inicio} ➜ ${datos.destino}%0A
%0A✅ Vehículo: ${datos.revVeh}%0A
✅ Equipo: ${datos.revEquipo}%0A
✅ Descanso: ${datos.revDescanso}%0A
✅ Documentos: ${datos.revDoc}%0A
%0A📝 Observaciones: ${datos.observaciones || "Sin observaciones"}%0A
%0A🔑 CÓDIGO: ${codigo}%0A
👉 Autorizar: https://drive-seguridad.onrender.com/autorizar`;

  res.json({
    exito: true,
    codigo: codigo,
    enlaceWhatsApp: `https://wa.me/593980530610?text=${mensaje}`
  });
});

// Verificar estado (la app revisa cada 2 segundos)
app.get('/estado/:codigo', (req, res) => {
  const cod = req.params.codigo;
  if (solicitudes[cod]) {
    return res.json({ estado: solicitudes[cod].estado });
  }
  res.json({ estado: "no_encontrado" });
});

// Recibir tu decisión
app.post('/respuesta', (req, res) => {
  const { codigo, decision } = req.body;
  if (solicitudes[codigo]) {
    solicitudes[codigo].estado = decision === "verde" ? "aprobado" : "rechazado";
    return res.json({ exito: true, mensaje: "Actualizado" });
  }
  res.json({ exito: false, mensaje: "Código no existe" });
});

// Página para que tú des la autorización
app.get("/autorizar", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta charset="UTF-8">
      <title>Autorización DRIVE</title>
      <style>
        body { font-family: Arial; max-width: 400px; margin: 40px auto; padding: 20px; background: #f5f7fa; }
        .caja { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { text-align: center; color: #0F4C81; margin-bottom: 25px; }
        input { width: 100%; padding: 14px; font-size: 22px; text-align: center; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; letter-spacing: 4px; }
        button { width: 100%; padding: 15px; font-size: 18px; font-weight: bold; border: none; border-radius: 8px; margin: 8px 0; color: white; cursor: pointer; }
        .verde { background: #27AE60; }
        .rojo { background: #EB5757; }
        #mensaje { text-align: center; margin-top: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="caja">
        <h2>🔑 AUTORIZACIÓN DE VIAJE</h2>
        <input type="text" id="codigo" maxlength="4" placeholder="Escribe el código de 4 dígitos">
        <button class="verde" onclick="autorizar('verde')">✅ LUZ VERDE</button>
        <button class="rojo" onclick="autorizar('rojo')">❌ LUZ ROJA</button>
        <p id="mensaje"></p>
      </div>
      <script>
        async function autorizar(tipo) {
          const cod = document.getElementById("codigo").value.trim();
          const msg = document.getElementById("mensaje");
          if (!cod || cod.length !== 4) {
            msg.textContent = "⚠️ Ingresa un código de 4 dígitos";
            msg.style.color = "#EB5757";
            return;
          }
          try {
            const res = await fetch("/respuesta", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ codigo: cod, decision: tipo })
            });
            const datos = await res.json();
            if (datos.exito) {
              msg.textContent = "✅ Listo! La app ya se desbloqueó";
              msg.style.color = "#27AE60";
              document.getElementById("codigo").value = "";
            } else {
              msg.textContent = "❌ Código no encontrado";
              msg.style.color = "#EB5757";
            }
          } catch (error) {
            msg.textContent = "❌ Error de conexión";
            msg.style.color = "#EB5757";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PUERTO, () => console.log("✅ SERVIDOR FUNCIONANDO CORRECTAMENTE"));
