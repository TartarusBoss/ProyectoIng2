import React, { useState } from "react";
import { submitSurvey } from "../api";
import "./SurveyForm.css";

const QUESTIONS_30 = [
  "El docente explica los temas de forma clara.",
  "El ritmo de la clase es adecuado para mi aprendizaje.",
  "Me siento motivado a participar en las actividades de clase.",
  "El docente responde de manera oportuna a las dudas.",
  "La metodología utilizada ha facilitado mi aprendizaje.",
  "Considero que los ejemplos dados en clase me ayudan a comprender los temas.",
  "Siento que estoy logrando los objetivos de aprendizaje planteados hasta ahora.",
  "La cantidad de tareas o actividades hasta este punto es adecuada para mi aprendizaje.",
  "Percibo que el docente se preocupa por mi progreso en la asignatura hasta ahora."
  ,"Hasta este momento, considero que el curso ha cumplido con mis expectativas iniciales."
];


const QUESTIONS_70 = [
  "El curso me ha permitido aprender los contenidos principales de la asignatura.",
  "El docente utiliza estrategias adecuadas para evaluar mi desempeño.",
  "La relación entre el docente y los estudiantes favorece el aprendizaje.",
  "El docente fomenta la participación y el debate en clase.",
  "Los recursos y materiales utilizados han sido útiles para mi aprendizaje.",
  "La retroalimentación recibida por parte del docente ha sido clara y constructiva.",
  "Los conceptos aprendidos hasta ahora me permiten resolver problemas más complejos de la asignatura.",
  "Considero que el ritmo de la clase y las actividades me han permitido consolidar mis conocimientos.",
  "La retroalimentación recibida hasta este punto ha mejorado mi desempeño académico.",
  "Percibo que el docente se preocupa por mi progreso en la asignatura hasta ahora."
];

export default function SurveyForm({ token, user, subject, goBack }) {
  const [corte, setCorte] = useState("30%");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [comments, setComments] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const QUESTIONS = corte === "30%" ? QUESTIONS_30 : QUESTIONS_70;

  const handleSelect = (i, v) => setAnswers(prev => ({ ...prev, [i]: v }));
  const handleComment = (i, v) => setComments(prev => ({ ...prev, [i]: v }));

  const next = async () => {
    if (!answers[current]) {
      alert("⚠️ Debes seleccionar una respuesta antes de continuar.");
      return;
    }

    if (current < QUESTIONS.length - 1) {
      return setCurrent(c => c + 1);
    }

    const payload = {
      surveyType: corte,
      subjectId: subject.id,
      answers: QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] || "", comment: comments[i] || "" }))
    };

    try {
      await submitSurvey(token, payload);
      // Don't fetch student feedback in admin; show a concise thank-you message instead
      setFeedback(null);
      setShowFeedback(true);
    } catch (err) {
      alert("Error al enviar la encuesta.");
      console.error(err);
    }
  };

  // Show a simple thank-you screen after submission. We don't need
  // to wait for `feedback` (it is intentionally null for student view),
  // so only check `showFeedback`.
  if (showFeedback) {
    return (
      <div className="container">
        <h3>✅ Encuesta enviada correctamente</h3>
        <h4>Gracias por la retroalimentación del {corte} del semestre</h4>
        <button onClick={goBack}>Volver</button>
      </div>
    );
  }

  const progress = ((current + 1) / QUESTIONS.length) * 100;

  return (
    <div className="container">
      <div className="header">
        <h1>Encuesta — {subject.name}</h1>
        <button onClick={goBack}>← Volver</button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Corte:</label>{" "}
        <select value={corte} onChange={e => setCorte(e.target.value)}>
          <option value="30%">30%</option>
          <option value="70%">70%</option>
        </select>
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="contador">
        Pregunta {current + 1} de {QUESTIONS.length}
      </div>

      <div className="pregunta">
        <p>{QUESTIONS[current]}</p>
        <div className="likert">
          {["Totalmente en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Totalmente de acuerdo"].map(opt => (
            <label key={opt}>
              <input
                type="radio"
                name={`q${current}`}
                value={opt}
                checked={answers[current] === opt}
                onChange={() => handleSelect(current, opt)}
              />
              {opt}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Comentario (opcional)"
          value={comments[current] || ""}
          onChange={e => handleComment(current, e.target.value)}
        />
      </div>

      <button onClick={next}>
        {current === QUESTIONS.length - 1 ? "Enviar encuesta" : "Siguiente"}
      </button>
    </div>
  );
}
