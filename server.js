const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PUERTO = process.env.PORT || 3000;

// Configuración esencial
app.use(cors({ origin: "*" })); // Permite conexión total
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Almacén de solicitudes
let solicitudes = {};

// Código de 4 dígitos
function generarCodigoCorto() {
  let codigo;
  do { codigo = Math.floor(1000 + Math.random() * 9000).toString(); }
  while (solicitudes[codigo]);
  return codigo;
}

// Recibir solicitud del conductor
app.post('/enviar-solicitud', (req, res) => {
  const datos = req.body;
  const codigo = generarCodigoCorto();
  solicitudes[codigo] = { ...datos, estado: "pendiente", fecha: new Date().toLocaleString("es-EC") };

  const mensaje = `*📋 SOLICITUD DE SALIDA*%0A
📅 Fecha: ${solicitudes[codigo].fecha}%0A
👤 Conductor: ${datos.conductor}%0A
🚗 Placa: ${datos.placa} | ${datos.tipoVeh}%0A
📍 Ruta: ${datos.inicio} ➜ ${datos.destino}%0A
%0A✅ Vehículo: ${datos.revVeh}%0A
✅ Equipo: ${datos.revEquipo}%0A
✅ Descanso: ${datos.revDescanso}%0A
✅ Documentos: ${datos.revDoc}%0A
%0A📝 Observ: ${datos.observaciones || "Sin observaciones"}%0A
%0A🔑 CÓDIGO: ${codigo}%0A
👉 Entra: https://drive-seguridad.onrender.com/autorizar%0A
Pon el código y da LUZ VERDE/ROJA`;

  res.json({ exito: true, codigo: codigo, enlaceWhatsApp: `https://wa.me/593980530610?text=${mensaje}` });
});

// Verificar estado (la app consulta cada 2 segundos)
app.get('/estado/:codigo', (req, res) => {
  const cod = req.params.codigo;
  if (solicitudes[cod]) return res.json({ estado: solicitudes[cod].estado });
  res.json({ estado: "no_encontrado" });
});

// Recibir autorización
app.post('/respuesta', (req, res) => {
  const { codigo, decision } = req.body;
  if (solicitudes[codigo]) {
    solicitudes[codigo].estado = decision === "verde" ? "aprobado" : "rechazado";
    return res.json({ exito: true, mensaje: "Actualizado" });
  }
  res.json({ exito: false, mensaje: "Código no existe" });
});

// Página de autorización para TI
app.get("/autorizar", (req, res) => {
  res.send(`
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autorizar DRIVE</title>
    <style>body{font-family:Arial;max-width:400px;margin:30px auto;padding:20px;}
    input{width:100%;padding:15px;font-size:24px;text-align:center;letter-spacing:5px;}
    button{width:100%;padding:15px;font-size:18px;border:none;border-radius:8px;color:white;font-weight:bold;margin:8px 0;}
    .verde{background:#27AE60;} .rojo{background:#EB5757;}</style></head>
    <body><h2 style="text-align:center">🔑 AUTORIZACIÓN</h2>
    <input type="text" id="cod" maxlength="4" placeholder="CÓDIGO 4 DÍGITOS">
    <button class="verde" onclick="autorizar('verde')">✅ LUZ VERDE</button>
    <button class="rojo" onclick="autorizar('rojo')">❌ LUZ ROJA</button>
    <p id="msg" style="text-align:center; font-weight:bold; margin-top:15px;"></p>
    <script>
    async function autorizar(tipo){
      const cod=document.getElementById("cod").value.trim();
      const m=document.getElementById("msg");
      if(!cod||cod.length!==4) return m.textContent="⚠️ Pon 4 dígitos";
      try{
        const r=await fetch("/respuesta",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({codigo:cod,decision:tipo})});
        const d=await r.json();
        m.textContent=d.exito?"✅ Listo! Ya se desbloqueó":"❌ Código no existe";
        m.style.color=d.exito?"#27AE60":"#EB5757";
        if(d.exito) document.getElementById("cod").value="";
      }catch(e){m.textContent="❌ Error de conexión";}
    }
    </script></body></html>
  `);
});

app.listen(PUERTO, () => console.log("✅ Servidor activo"));
