import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function SurveyResults() {
  const [rows, setRows] = useState([]);
  useEffect(()=>{
    // endpoint /stats/materia/:nombre devuelve filas; si quieres ver todo, se puede crear un endpoint en backend.
  }, []);
  return (
    <div className="container">
      <h3>Resultados (vista básica)</h3>
      <p>Usa el panel de admin para ver estadísticas y exportar.</p>
    </div>
  );
}
