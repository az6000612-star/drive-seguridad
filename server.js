const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// 📂 Leer archivos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// 🏠 Enviar la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log('✅ SERVIDOR CORRIENDO CORRECTAMENTE');
  console.log('🌐 Abre en el navegador: http://localhost:3000');
});