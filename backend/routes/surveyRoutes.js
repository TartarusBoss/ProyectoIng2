// surveyRoutes.js
import express from "express";
import XLSX from "xlsx";

const router = express.Router();

// Guardamos temporalmente las respuestas
let responses = [];

// Guardar respuestas
router.post("/", (req, res) => {
  const { surveyType, answers } = req.body;

  if (!surveyType || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  // Guardamos la fecha junto con las respuestas
  const entry = {
    surveyType,
    answers,
    date: new Date()
  };

  responses.push(entry);
  res.json({ message: "✅ Respuesta guardada correctamente" });
});

// Obtener resultados
router.get("/results", (req, res) => {
  res.json(responses);
});

// Exportar a Excel
router.get("/export", (req, res) => {
  // Transformamos los datos para que cada fila sea una respuesta individual
  const flatData = responses.flatMap(r =>
    r.answers.map(a => ({
      Tipo: r.surveyType,
      Pregunta: a.question,
      Respuesta: a.answer,
      Fecha: new Date(r.date).toLocaleString()
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(flatData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=report.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

export default router;
