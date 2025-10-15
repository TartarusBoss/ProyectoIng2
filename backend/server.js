import express from "express";
import cors from "cors";
// 👇 cambia esta línea
import surveyRoutes from "./routes/surveyRoutes.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 👇 ahora sí funciona la ruta correcta
app.use("/api/survey", surveyRoutes);

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
