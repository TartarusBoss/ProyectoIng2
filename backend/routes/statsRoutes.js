// backend/routes/statsRoutes.js
import express from "express";
import XLSX from "xlsx";

const router = express.Router();

// GET /api/stats/:subjectId  -> devuelve filas relacionadas (simple)
router.get("/:subjectId", async (req, res) => {
  try {
    const db = req.db;
    const { subjectId } = req.params;
    // Si no tienes una tabla 'responses' usamos surveys + survey_answers.
    const rows = await db.all(
      `SELECT s.id as survey_id, s.survey_type, s.date, sub.name as subject, u.name as user_name,
              sa.question_index, sa.question_text, sa.answer, sa.comment
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.subject_id = ?
       ORDER BY s.date`,
      [subjectId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error /stats/:subjectId", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Export to Excel
router.get("/export/:subjectId", async (req, res) => {
  try {
    const db = req.db;
    const { subjectId } = req.params;
    const rows = await db.all(
      `SELECT s.id as survey_id, s.survey_type, s.date, sub.name as subject, u.name as user_name,
              sa.question_index, sa.question_text, sa.answer, sa.comment
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.subject_id = ?
       ORDER BY s.date`,
      [subjectId]
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    console.error("Error export /stats/export/:subjectId", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
