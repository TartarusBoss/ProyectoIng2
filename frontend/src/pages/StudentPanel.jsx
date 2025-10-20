import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SurveyForm from "../components/SurveyForm";

const SUBJECTS = ["Matemáticas", "Física", "Programación"];

export default function StudentPanel() {
  const nav = useNavigate();
  const stored = JSON.parse(localStorage.getItem("user") || "null");
  const [user] = useState(stored);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) nav("/");
  }, []);

  if (!user) return null;

  if (selected) {
    return <SurveyForm user={user} materia={selected} goBack={() => setSelected(null)} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h3>Bienvenido, {user.nombre} (Estudiante)</h3>
        <div>
          <button onClick={() => { localStorage.removeItem("user"); nav("/"); }}>Cerrar sesión</button>
        </div>
      </div>

      <h4 style={{marginTop:12}}>Elige la materia para responder la encuesta</h4>
      <div className="grid" style={{marginTop:10}}>
        {SUBJECTS.map(s => (
          <div key={s} style={{padding:12,border:"1px solid #eee",borderRadius:8}}>
            <b>{s}</b>
            <div style={{marginTop:8}}>
              <button onClick={() => setSelected(s)}>Responder encuesta</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
