import React, { useEffect, useState } from "react";
import { getSubjects } from "../api";
import SurveyForm from "./SurveyForm";

export default function StudentPanel({ user, token, logout }) {
  const [subjects, setSubjects] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getSubjects(token)
      .then(r => { setSubjects(r.data); setLoadError(null); })
      .catch(err => {
        console.error('getSubjects error', err);
        if (err && err.response && err.response.status === 401) {
          // token invalid or expired -> force logout to re-login
          logout && logout();
        } else {
          setLoadError('No se pudieron obtener materias. Revisa la conexión al backend.');
        }
      });
  }, [token]);

  if (showForm && selected) {
    return <SurveyForm token={token} user={user} subject={selected} goBack={() => setShowForm(false)} />;
  }

  return (
    <div className="container">
      <div className="header">
        <h3>Bienvenido, {user.name}</h3>
        <button onClick={logout} className="primary-btn">Cerrar sesión</button>
      </div>
      <h4>Seleccione la materia</h4>
      {loadError ? (
        <div style={{ padding: 12, background: '#fff3f3', borderRadius: 8, color: '#a50034' }}>{loadError}</div>
      ) : (
        <div className="subjects-grid">
          {subjects.map(s => (
            <div key={s.id} className="subject-card">
              <b>{s.name}</b>
              <button className="primary-btn" onClick={() => { setSelected(s); setShowForm(true); }}>
                Responder encuesta
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
