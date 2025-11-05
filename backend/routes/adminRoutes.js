// backend/routes/adminRoutes.js
import express from "express";
import { authenticate /*, requireRole */ } from "../middleware.js";

const router = express.Router();

// Get subjects
router.get("/subjects", authenticate, async (req, res) => {
  try {
    const db = req.db;
    // Si el usuario es profesor, solo devolver sus materias
    if (req.user.role === 'professor') {
      const subs = await db.all(
        "SELECT s.*, u.name as teacher_name FROM subjects s LEFT JOIN users u ON s.teacher_id = u.id WHERE s.teacher_id = ? ORDER BY s.id",
        [req.user.id]
      );
      res.json(subs);
    } else {
      // Admin ve todas las materias con el nombre del profesor
      const subs = await db.all(
        "SELECT s.*, u.name as teacher_name FROM subjects s LEFT JOIN users u ON s.teacher_id = u.id ORDER BY s.id"
      );
      res.json(subs);
    }
  } catch (err) {
    console.error("Error /admin/subjects:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// Get professors list
router.get('/professors', authenticate, async (req, res) => {
  try {
    const db = req.db;
    const profs = await db.all("SELECT id, name, username FROM users WHERE role = 'professor' ORDER BY name");
    res.json(profs);
  } catch (err) {
    console.error('Error /admin/professors', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Stats per subject (admin or professor) + richer aggregations and recommendations
router.get("/stats/:subjectId", authenticate, async (req, res) => {
  try {
    const db = req.db;
    const subjectIdParam = req.params.subjectId;

    // Defensive: allow subjectId to be either numeric id or subject name
    let subjectId = subjectIdParam;
    if (isNaN(Number(subjectIdParam))) {
      const sub = await db.get("SELECT id FROM subjects WHERE name = ?", subjectIdParam);
      if (sub) subjectId = sub.id;
    }

    // Get teacher name for this subject
    const subjectInfo = await db.get(
      "SELECT s.*, u.name as teacher_name FROM subjects s LEFT JOIN users u ON s.teacher_id = u.id WHERE s.id = ?",
      [subjectId]
    );

    // Si el usuario es profesor, verificar que la materia le pertenece
    if (req.user.role === 'professor' && subjectInfo && subjectInfo.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "forbidden" });
    }

    // average score per question (map likert to 1-5)
    const rows = await db.all(
      `SELECT
         sa.question_index,
         sa.question_text,
         AVG(
           CASE sa.answer
             WHEN 'Totalmente en desacuerdo' THEN 1
             WHEN 'En desacuerdo' THEN 2
             WHEN 'Neutral' THEN 3
             WHEN 'De acuerdo' THEN 4
             WHEN 'Totalmente de acuerdo' THEN 5
             ELSE NULL
           END
         ) as avg_score,
         COUNT(*) as responses
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       WHERE s.subject_id = ?
       GROUP BY sa.question_index, sa.question_text
       ORDER BY sa.question_index`,
      [subjectId]
    );

    // averages by survey type (30% vs 70%)
    const avgByType = await db.all(
      `SELECT s.survey_type as surveyType,
              AVG(CASE sa.answer
                WHEN 'Totalmente en desacuerdo' THEN 1
                WHEN 'En desacuerdo' THEN 2
                WHEN 'Neutral' THEN 3
                WHEN 'De acuerdo' THEN 4
                WHEN 'Totalmente de acuerdo' THEN 5
                ELSE NULL END) as avg_score
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       WHERE s.subject_id = ?
       GROUP BY s.survey_type`,
      [subjectId]
    );

    // participation: number of completed surveys and distinct students per survey type
    const participation = await db.all(
      `SELECT s.survey_type as surveyType,
              COUNT(*) as submissions,
              COUNT(DISTINCT s.user_id) as students_count
       FROM surveys s
       WHERE s.subject_id = ?
       GROUP BY s.survey_type`,
      [subjectId]
    );

    // distribution of answers by likert label
    const distribution = await db.all(
      `SELECT sa.answer as label, COUNT(*) as count
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       WHERE s.subject_id = ?
       GROUP BY sa.answer`,
      [subjectId]
    );

    // trend over time: average score per day
    const trend = await db.all(
      `SELECT DATE(s.date) as day,
              AVG(CASE sa.answer
                WHEN 'Totalmente en desacuerdo' THEN 1
                WHEN 'En desacuerdo' THEN 2
                WHEN 'Neutral' THEN 3
                WHEN 'De acuerdo' THEN 4
                WHEN 'Totalmente de acuerdo' THEN 5
                ELSE NULL END) as avg_score,
              COUNT(*) as responses
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       WHERE s.subject_id = ?
       GROUP BY DATE(s.date)
       ORDER BY DATE(s.date)`,
      [subjectId]
    );

    // averages per question split by survey type (30% vs 70%)
    const averagesByQuestionByType = await db.all(
      `SELECT s.survey_type as surveyType, sa.question_index, sa.question_text,
              AVG(CASE sa.answer
                WHEN 'Totalmente en desacuerdo' THEN 1
                WHEN 'En desacuerdo' THEN 2
                WHEN 'Neutral' THEN 3
                WHEN 'De acuerdo' THEN 4
                WHEN 'Totalmente de acuerdo' THEN 5
                ELSE NULL END) as avg_score
       FROM survey_answers sa
       JOIN surveys s ON sa.survey_id = s.id
       WHERE s.subject_id = ?
       GROUP BY s.survey_type, sa.question_index, sa.question_text
       ORDER BY sa.question_index, s.survey_type`,
      [subjectId]
    );

    // Feedback generation
    const teacherFeedback = [];
    const studentFeedback = [];

    const avgAll = rows.length ? rows.reduce((acc, r) => acc + (r.avg_score || 0), 0) / rows.length : 0;

    // Teacher-focused tips: be specific per ranges
    if (avgAll >= 4.4) {
      teacherFeedback.push('🎉 El rendimiento general es excelente. Mantener estrategias actuales.');
      teacherFeedback.push('🔁 Considera actividades de extensión para estudiantes con alto rendimiento.');
    } else if (avgAll >= 3.6) {
      teacherFeedback.push('� Buen desempeño general; revisa las preguntas con puntaje menor a 3.5.');
      teacherFeedback.push('🧭 Refuerza los puntos recurrentes en las próximas clases y facilita ejercicios prácticos.');
    } else if (avgAll >= 2.8) {
      teacherFeedback.push('⚠️ Hay áreas con resultados moderados; planifica sesiones de repaso dirigidas.');
      teacherFeedback.push('📋 Agrega recursos complementarios y evalúa la claridad en la exposición de esos temas.');
    } else {
      teacherFeedback.push('🚨 Resultados bajos en general. Replantear la secuencia de contenidos y actividades.');
      teacherFeedback.push('✍️ Implementar tareas de refuerzo y ofrecer horas de consulta.');
    }

    // Per-question specific suggestions (teacher)
    const lows = rows.filter(r => r.avg_score && r.avg_score <= 3.2).slice(0, 4);
    for (const l of lows) {
      teacherFeedback.push(`🔧 Reforzar: "${l.question_text}" (promedio ${Number((l.avg_score||0).toFixed(2))}).`);
    }

    // Student feedback (kept but kept short for display after survey)
    if (avgAll >= 4.2) {
      studentFeedback.push('✨ Buen entendimiento general. Sigue así.');
    } else if (avgAll >= 3.2) {
      studentFeedback.push('💡 Buen desempeño; revisa preguntas con menor puntaje.');
    } else {
      studentFeedback.push('🔎 Se recomienda repasar contenidos y aprovechar recursos.');
    }

    // Add targeted student hint for lowest question
    const sortedAsc = rows.slice().sort((a, b) => (a.avg_score || 5) - (b.avg_score || 5));
    const low = sortedAsc[0];
    if (low && low.avg_score <= 2.8) {
      studentFeedback.push(`📚 Atención: "${low.question_text}" podría necesitar repaso.`);
    }

    // Teacher rating aggregation for this subject (average stars 1-5)
    const teacherRatingRow = await db.get(
      `SELECT AVG(teacher_rating) as avg, COUNT(teacher_rating) as count
       FROM surveys
       WHERE subject_id = ? AND teacher_rating IS NOT NULL`,
      [subjectId]
    );

    res.json({
      stats: rows,
      averagesByType: avgByType,
      averagesByQuestionByType,
      participation,
      distribution,
      trend,
      teacherRating: teacherRatingRow || { avg: null, count: 0 },
      teacherName: subjectInfo?.teacher_name || null, // Agregar nombre del profesor
      feedback: {
        teacher: teacherFeedback,
        student: studentFeedback
      }
    });
  } catch (err) {
    console.error("Error /admin/stats/:id", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
