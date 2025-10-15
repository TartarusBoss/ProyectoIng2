import React, { useState } from "react";
import { sendSurvey } from "../api";
import "./SurveyForm.css";

const preguntas30 = [
  { id: 1, text: "El docente explica los temas de forma clara.", adaptativa: "¿Qué parte de las explicaciones no ha quedado clara?" },
  { id: 2, text: "El ritmo de la clase es adecuado para mi aprendizaje." },
  { id: 3, text: "El docente utiliza recursos tecnológicos de manera adecuada." },
  { id: 4, text: "Me siento motivado a participar en las actividades de clase.", adaptativa: "¿Qué actividad te motivaría más a participar en clase?" },
  { id: 5, text: "El docente responde de manera oportuna a las dudas." },
  { id: 6, text: "La metodología utilizada ha facilitado mi aprendizaje.", adaptativa: "¿Qué cambios en la metodología propondrías?" },
  { id: 7, text: "El docente ha mostrado fortalezas importantes en su desempeño hasta ahora." },
  { id: 8, text: "El docente está comprometido con mejorar su enseñanza durante el resto del semestre." },
  { id: 9, text: "El docente fomenta un ambiente respetuoso en clase." },
  { id: 10, text: "La organización de los contenidos facilita mi aprendizaje." }
];

const preguntas70 = [
  { id: 1, text: "El curso me ha permitido aprender los contenidos principales de la asignatura." },
  { id: 2, text: "El docente utiliza estrategias adecuadas para evaluar mi desempeño.", adaptativa: "¿Qué cambios recomendarías en la forma de evaluar?" },
  { id: 3, text: "La relación entre el docente y los estudiantes favorece el aprendizaje.", adaptativa: "¿Qué aspecto de la relación docente-estudiantes debería mejorar?" },
  { id: 4, text: "El docente fomenta la participación y el debate en clase." },
  { id: 5, text: "Los recursos y materiales utilizados han sido útiles para mi aprendizaje." },
  { id: 6, text: "La retroalimentación recibida por parte del docente ha sido clara y constructiva.", adaptativa: "¿Qué tipo de retroalimentación te ayudaría más a mejorar tu aprendizaje?" },
  { id: 7, text: "La metodología utilizada ha sido útil para comprender los contenidos del curso." },
  { id: 8, text: "El docente ha reforzado los temas necesarios para garantizar el aprendizaje completo." },
  { id: 9, text: "El docente mantiene la motivación de los estudiantes durante el curso." },
  { id: 10, text: "Los objetivos del curso fueron claros desde el inicio." }
];

export default function SurveyForm({ surveyType = "30%", goBack }) {
  const [encuesta, setEncuesta] = useState(surveyType === "30%" ? 30 : 70);
  const [current, setCurrent] = useState(0);
  const [respuestas, setRespuestas] = useState({ 30: {}, 70: {} });
  const [adaptativas, setAdaptativas] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);

  const preguntas = encuesta === 30 ? preguntas30 : preguntas70;
  const total = preguntas.length;

  const handleChange = (id, value) => {
    setRespuestas(prev => ({
      ...prev,
      [encuesta]: { ...prev[encuesta], [id]: value }
    }));

    if (preguntas.find(q => q.id === id)?.adaptativa) {
      setAdaptativas(prev => ({
        ...prev,
        [id]: value === "Totalmente en desacuerdo"
      }));
    }
  };

  const nextQuestion = async () => {
    if (current < total - 1) {
      setCurrent(current + 1);
    } else {
      setShowFeedback(true);
      await sendSurvey({ surveyType: encuesta, answers: respuestas[encuesta] });
    }
  };

  const switchEncuesta = () => {
    const nuevo = encuesta === 30 ? 70 : 30;
    setEncuesta(nuevo);
    setCurrent(0);
    setShowFeedback(false);
  };

  // ✅ Retroalimentación fija distinta para cada encuesta
  const feedback30 = {
    docente: [
      "👍 Has demostrado claridad al explicar los temas, lo que ha facilitado el proceso de aprendizaje.",
      "📉 Podrías mejorar la forma en que fomentas la participación para involucrar a más estudiantes."
    ],
    estudiante: [
      "🌟 Has mostrado compromiso con las clases hasta este punto del semestre.",
      "📚 Se recomienda reforzar el estudio independiente para mejorar el rendimiento en la segunda parte del curso."
    ]
  };

  const feedback70 = {
    docente: [
      "✅ Tu metodología ha tenido un impacto positivo en el aprendizaje de los estudiantes.",
      "⚠️ Considera ajustar algunos métodos de evaluación para que reflejen mejor las competencias desarrolladas."
    ],
    estudiante: [
      "👏 Has participado activamente en el proceso formativo y has aprovechado los recursos del curso.",
      "🔎 Sería útil repasar los temas clave antes de los exámenes finales para consolidar el conocimiento."
    ]
  };

  const feedback = encuesta === 30 ? feedback30 : feedback70;

  if (showFeedback) {
    return (
      <div className="container">
        <h2>👀 Retroalimentación – Corte {encuesta}%</h2>

        <h3>Para el docente:</h3>
        <ul>
          {feedback.docente.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>

        <h3>Para el estudiante:</h3>
        <ul>
          {feedback.estudiante.map((f, idx) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>

        {goBack && <button onClick={goBack}>⬅️ Volver al inicio</button>}
        <button onClick={switchEncuesta} style={{ marginLeft: "10px" }}>
          Cambiar de encuesta
        </button>
      </div>
    );
  }

  const progress = ((current + 1) / total) * 100;

  return (
    <div className="container">
      <div className="header">
        <h1>Encuesta Docente – Corte {encuesta}%</h1>
        <button onClick={switchEncuesta}>
          Ir a encuesta {encuesta === 30 ? "70%" : "30%"}
        </button>
      </div>

      <div className="contador">
        Pregunta {current + 1} de {total}
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="pregunta active">
        <h2>{preguntas[current].text}</h2>

        <div className="likert">
          {["Totalmente en desacuerdo","En desacuerdo","Neutral","De acuerdo","Totalmente de acuerdo"].map((label, idx) => (
            <label key={idx} style={{ margin: "0 5px" }}>
              {label}<br />
              <input
                type="radio"
                name={`p${preguntas[current].id}`}
                value={label}
                onChange={() => handleChange(preguntas[current].id, label)}
              />
            </label>
          ))}
        </div>

        {preguntas[current].adaptativa && adaptativas[preguntas[current].id] && (
          <textarea
            rows="3"
            placeholder={preguntas[current].adaptativa}
            onChange={(e) => handleChange(preguntas[current].id + "_adapt", e.target.value)}
            style={{ marginTop: "10px", width: "100%" }}
          ></textarea>
        )}

        <button onClick={nextQuestion} style={{ marginTop: "15px" }}>
          {current === total - 1 ? "Ver retroalimentación" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
