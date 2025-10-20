// frontend/src/components/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { getSubjects, getStats, exportResults, getProfessors } from "../api";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

// register ChartJS components to avoid the "not registered" runtime error
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
// register Line elements
import {
  PointElement,
  LineElement
} from 'chart.js';
ChartJS.register(PointElement, LineElement);

export default function AdminPanel({ user, token, logout }) {
  const [subjects, setSubjects] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [sel, setSel] = useState(null);
  const [selectedProf, setSelectedProf] = useState(null);
  const [stats, setStats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [averagesByType, setAveragesByType] = useState([]);
  const [participation, setParticipation] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [averagesByQuestionByType, setAveragesByQuestionByType] = useState([]);

  const chartOptions = { responsive: true, maintainAspectRatio: false };

  useEffect(() => {
    getSubjects(token)
      .then(r => { setSubjects(r.data); setLoadError(null); })
      .catch(err => {
        console.error("getSubjects:", err);
        if (err && err.response && err.response.status === 401) {
          logout && logout();
        } else {
          setLoadError('No se pudieron cargar materias. Revisa la conexión al backend.');
        }
      });
    // default professor option (only Profesor 1 for now)
    setProfessors([{ id: 1, name: 'Profesor 1' }]);
    setSelectedProf({ id: 1, name: 'Profesor 1' });
  }, [token]);

  const load = (s) => {
    setSel(s);
    setLoadingStats(true);
    setLoadError(null);
    getStats(token, s.id)
      .then(r => {
        // r.data now includes: stats, averagesByType, participation, distribution, feedback.teacher
        const data = r.data || {};
        setStats(data.stats || []);
        setFeedback(data.feedback || null);
        // attach extra payloads into state for charts
        setAveragesByType(data.averagesByType || []);
        setParticipation(data.participation || []);
        setDistribution(data.distribution || []);
        setTrend(data.trend || []);
        setAveragesByQuestionByType(data.averagesByQuestionByType || []);
      })
      .catch(err => {
        console.error("getStats error:", err);
        let msg = 'Error cargando estadísticas.';
        if (err && err.response) {
          msg += ` (${err.response.status}) ${JSON.stringify(err.response.data)}`;
        } else {
          msg += ` ${err.message}`;
        }
        setLoadError(msg);
        setStats([]);
        setFeedback(null);
      })
      .finally(() => setLoadingStats(false));
  };

  const onSelectProf = (id) => {
    const p = professors.find(x => x.id === Number(id));
    setSelectedProf(p || null);
  };

  const doExport = () => {
    exportResults(token)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "resultados.xlsx";
        a.click();
      })
      .catch(err => {
        console.error("export error:", err);
        alert("Error exportando");
      });
  };

  // prepare data for charts (if stats available)
  const labels = stats.map(s => `Q${s.question_index}`);
  const averages = stats.map(s => Number((s.avg_score || 0).toFixed(2)));
  const responses = stats.map(s => s.responses || 0);

  const barData = {
    labels,
    datasets: [
      {
        label: "Promedio",
        data: averages,
        backgroundColor: "#a50034"
      }
    ]
  };

  // build grouped per-question chart (30% vs 70%) outside of JSX to avoid nested IIFEs
  let groupedByQuestionChart = <p>No hay datos por pregunta disponibles.</p>;
  if (averagesByQuestionByType && averagesByQuestionByType.length > 0) {
    // Build an ordered list of question indices
    const orderedQis = Array.from(new Set(averagesByQuestionByType.map(r => r.question_index))).sort((a,b)=>a-b);

    // Build a mapping of question text per survey type so each dataset shows its own question text in tooltips
    const types = Array.from(new Set(averagesByQuestionByType.map(r=>r.surveyType)));
    const questionTextByType = {};
    types.forEach(t => {
      questionTextByType[t] = orderedQis.map(qi => {
        const row = averagesByQuestionByType.find(x => x.surveyType === t && x.question_index === qi);
        return row ? row.question_text : '';
      });
    });

    // Short labels on x-axis (no long text below). We'll hide ticks so nothing shows under the bars.
    const labelsShort = orderedQis.map((_, i) => `Q${i+1}`);

    const datasets = types.map((t, idx) => ({
      label: t,
      data: orderedQis.map(qi => {
        const r = averagesByQuestionByType.find(x => x.surveyType===t && x.question_index===qi);
        return r ? Number((r.avg_score||0).toFixed(2)) : null;
      }),
      backgroundColor: ['#4e79a7','#f28e2b'][idx%2]
    }));

    // Custom options: hide x-axis tick labels and show full question text in tooltip title
    const groupedChartOptions = {
      ...chartOptions,
      responsive: true,
      scales: {
        x: { stacked: false, ticks: { display: false } },
        y: { beginAtZero: true, suggestedMax: 5 }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => {
              if (!items || items.length === 0) return '';
              const item = items[0];
              const type = item.dataset.label;
              const idx = item.dataIndex;
              return (questionTextByType[type] && questionTextByType[type][idx]) || '';
            },
            label: (item) => {
              return `${item.dataset.label}: ${item.formattedValue}`;
            }
          }
        }
      }
    };

    groupedByQuestionChart = (
      <div className="chart-card" style={{ height: 260 }}>
        <Bar data={{ labels: labelsShort, datasets }} options={groupedChartOptions} />
      </div>
    );
  }

  // removed pieData (distribution charts) per UX request

  const hasAnyData = (stats.length > 0 || averagesByType.length > 0 || participation.length > 0 || distribution.length > 0 || (feedback && ((feedback.teacher||[]).length>0 || (feedback.student||[]).length>0)));

  const statsContent = (
    <div>
      <div style={{ marginTop: 6 }}>
        <h4>Promedio por pregunta (30% vs 70%)</h4>
        {groupedByQuestionChart}

        <div style={{ marginTop: 12 }}>
          <h4>Retroalimentación (profesor)</h4>
          {feedback && feedback.teacher && feedback.teacher.length > 0 ? (
            <ul>
              {feedback.teacher.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          ) : (
            <p>No hay retroalimentación para el profesor aún.</p>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Evolución del promedio por encuesta (30% vs 70%)</h4>
          {averagesByType && averagesByType.length > 0 ? (
            <div className="chart-card" style={{ height: 200 }}>
              <Bar data={{
                labels: averagesByType.map(a => a.surveyType),
                datasets: [{ label: 'Promedio', data: averagesByType.map(a => Number((a.avg_score||0).toFixed(2))), backgroundColor: ['#4e79a7','#f28e2b'] }]
              }} options={chartOptions} />
            </div>
          ) : <p>No hay suficientes datos por tipo de encuesta.</p>}
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Participación</h4>
          {participation && participation.length > 0 ? (
            <div className="chart-card" style={{ height: 200 }}>
              <Bar data={{
                labels: participation.map(p => p.surveyType),
                datasets: [{ label: 'Completadas', data: participation.map(p => p.submissions || 0), backgroundColor: '#76b7b2' }]
              }} options={{ ...chartOptions, indexAxis: 'y' }} />
            </div>
          ) : <p>No hay datos de participación.</p>}
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={doExport}>Exportar a Excel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <h3>Panel — {user.name} ({user.role})</h3>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <select value={selectedProf?.id||""} onChange={e=>onSelectProf(e.target.value)}>
            {professors.length>0 ? professors.map(p=> <option key={p.id} value={p.id}>{p.name}</option>) : <option value="1">Profesor 1</option>}
          </select>
          <button onClick={logout} className="primary-btn">Cerrar sesión</button>
        </div>
      </div>

      <div className="admin-wrap">
        <div className="admin-left">
          <h4>Materias</h4>
          {subjects.map(s => (
            <div key={s.id} className="chart-card">
              <b>{s.name}</b>
              <div style={{ marginTop: 6 }}>
                <button className="primary-btn" onClick={() => load(s)}>Ver estadísticas</button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-right">
          <h4>Estadísticas {sel?.name}</h4>

          {loadingStats && <p>Cargando estadísticas...</p>}

          {loadError && (
            <div style={{ padding: 12, background: '#fff3f3', color: '#a50034', borderRadius: 8, marginBottom: 12 }}>{loadError}</div>
          )}

          {!loadingStats && stats.length === 0 && averagesByType.length === 0 && participation.length === 0 && distribution.length === 0 && (!feedback || ((feedback.teacher||[]).length===0 && (feedback.student||[]).length===0)) && (
            <p>Selecciona una materia para ver gráficos</p>
          )}

          {!loadingStats && hasAnyData && (
            statsContent
          )}
        </div>
      </div>
    </div>
  );
}
