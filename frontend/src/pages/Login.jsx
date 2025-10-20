import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    if (!usuario || !contraseña) return alert("Completa ambos campos");
    setLoading(true);
    try {
      const res = await login({ usuario, contraseña });
      const user = res.data;
      // guardamos en localStorage
      localStorage.setItem("user", JSON.stringify(user));
      // redirige según rol
      if (user.rol === "estudiante") nav("/student");
      else nav("/admin");
    } catch (err) {
      alert("Credenciales incorrectas. Revisa usuario/contraseña.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header"><h2>Inicio de sesión</h2></div>
      <form onSubmit={handle}>
        <div style={{marginTop:10}}>
          <input placeholder="Usuario" value={usuario} onChange={e => setUsuario(e.target.value)} />
        </div>
        <div style={{marginTop:10}}>
          <input placeholder="Contraseña" type="password" value={contraseña} onChange={e => setContraseña(e.target.value)} />
        </div>
        <div style={{marginTop:12}}>
          <button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button>
        </div>
        <p className="small" style={{marginTop:10}}>
          Cuentas ejemplo: admin/1234 ; juan/1234 ; maria/1234 ; carlos/1234 ; ana/1234 ; luis/1234 ; marta/1234
        </p>
      </form>
    </div>
  );
}
