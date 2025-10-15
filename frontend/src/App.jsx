import { useState } from "react";
import SurveyForm from "./components/SurveyForm";
import SurveyResults from "./components/SurveyResults";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [surveyType, setSurveyType] = useState(null);

  const startSurvey = (type) => {
    setSurveyType(type);
    setScreen("survey");
  };

  const goHome = () => {
    setSurveyType(null);
    setScreen("home");
  };

  return (
    <div className="container">
      {screen === "home" && (
        <div className="home">
          <h1>📊 Encuestas de Evaluación Docente</h1>
          <button onClick={() => startSurvey("30%")}>Encuesta del 30%</button>
          <button onClick={() => startSurvey("70%")}>Encuesta del 70%</button>
        </div>
      )}

      {screen === "survey" && (
        <SurveyForm surveyType={surveyType} goBack={goHome} goResults={() => setScreen("results")} />
      )}

      {screen === "results" && <SurveyResults goBack={goHome} />}
    </div>
  );
}
