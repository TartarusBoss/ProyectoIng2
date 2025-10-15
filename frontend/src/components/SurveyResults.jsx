import { useEffect, useState } from "react";
import { getResults } from "../api";
import ExportButton from "./ExportButton";

export default function SurveyResults({ goBack }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    getResults().then((res) => {
      if (res.data) setResults(res.data);
    });
  }, []);

  return (
    <div className="results">
      <h2>📈 Retroalimentación de las encuestas</h2>
      <ExportButton />

      {results.length === 0 ? (
        <p>No hay respuestas aún.</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) =>
              r.answers.map((a, j) => (
                <tr key={`${i}-${j}`}>
                  <td>{r.surveyType}</td>
                  <td>{a.question}</td>
                  <td>{a.answer}</td>
                  <td>{new Date(r.date).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <button onClick={goBack} style={{ marginTop: "20px" }}>
        ⬅️ Volver al inicio
      </button>
    </div>
  );
}
