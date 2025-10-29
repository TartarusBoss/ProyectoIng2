import express from "express";
import { authenticate } from "../middleware.js";
import XLSX from "xlsx";

const router = express.Router();

// Submit survey: requires auth (student)
router.post("/submit", authenticate, async (req, res) => {
  const db = req.db;
  const userId = req.user.id;
  const { surveyType, subjectId, answers } = req.body;

  // optional teacher rating (1-5 stars)
  const teacherRating = req.body.teacherRating ? Number(req.body.teacherRating) : null;

  if (!surveyType || !subjectId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  const info = await db.run(
    "INSERT INTO surveys (user_id, subject_id, survey_type, teacher_rating) VALUES (?,?,?,?)",
    userId,
    subjectId,
    surveyType,
    teacherRating
  );
  const surveyId = info.lastID;

  const insert = await db.prepare(
    "INSERT INTO survey_answers (survey_id, question_index, question_text, answer, comment) VALUES (?,?,?,?,?)"
  );
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    await insert.run(surveyId, i + 1, a.question || "", a.answer || "", a.comment || "");
  }
  await insert.finalize();

  res.json({ message: "✅ Respuesta guardada correctamente", surveyId });
});

// Get all results (admin only) - but we don't require auth here to allow your frontend SurveyResults show; in production protect it.
router.get("/results", async (req, res) => {
  const db = req.db;
  // Return surveys with answers
  const surveys = await db.all("SELECT * FROM surveys ORDER BY date DESC");
  const results = [];
  for (const s of surveys) {
    const answers = await db.all("SELECT question_index,question_text,answer,comment FROM survey_answers WHERE survey_id = ? ORDER BY question_index", s.id);
    results.push({ surveyId: s.id, surveyType: s.survey_type, subjectId: s.subject_id, userId: s.user_id, date: s.date, answers });
  }
  res.json(results);
});

// Export to Excel (all results)
router.get("/export", async (req, res) => {
  const db = req.db;
  const rows = await db.all(`
    SELECT s.id as survey_id, s.survey_type, s.date, sub.name as subject, u.name as user_name,
           sa.question_index, sa.question_text, sa.answer, sa.comment
    FROM survey_answers sa
    JOIN surveys s ON sa.survey_id = s.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    ORDER BY s.date
  `);
  // Note: teacher_rating is stored in surveys (1-5). Include it in export rows separately.
  // We'll append ratings per survey id when available
  for (const r of rows) {
    const sr = await db.get("SELECT teacher_rating FROM surveys WHERE id = ?", r.survey_id);
    r.teacher_rating = sr ? sr.teacher_rating : null;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

export default router;
