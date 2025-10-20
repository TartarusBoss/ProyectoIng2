import React, { useState } from "react";
import { loginAPI } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      const res = await loginAPI({ username, password });
      const { token, user } = res.data;
      onLogin(user, token);
    } catch (err) {
      alert("Credenciales inválidas. Cuentas por defecto:\nadmin/admin123\nprof1/prof1123\nprof2/prof2123\nprof3/prof3123\nstud1/stud1123\nstud2/stud2123\nstud3/stud3123");
    }
  };

  return (
    <div className="container">
      <div className="login-card">
        <h2 style={{marginBottom:6}}>Sistema de Evaluación<br/>Docente</h2>
        <form onSubmit={handle}>
          <div style={{marginTop:12}}><input placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} /></div>
          <div style={{marginTop:12}}><input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div style={{marginTop:18}}><button className="primary-btn" type="submit">Iniciar sesión</button></div>
          <p className="small" style={{marginTop:12}}>¿Olvidaste tu contraseña?</p>
        </form>
        <p className="small" style={{marginTop:12}}>Cuentas de prueba: admin/admin123 ; prof1/prof1123 ; stud1/stud1123</p>
      </div>
    </div>
  );
}
