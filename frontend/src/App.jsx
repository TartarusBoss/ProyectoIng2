import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import StudentPanel from "./components/StudentPanel";
import AdminPanel from "./components/AdminPanel";
import ProfessorPanel from "./components/ProfessorPanel";

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    }
  }, [user, token]);

  const onLogin = (userObj, tokenStr) => {
    setUser(userObj);
    setToken(tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  if (!user) return (
    <div>
      <Header />
      <Login onLogin={onLogin} />
    </div>
  );

  return (
    <div>
      <Header />
      {user.role === 'student' ? (
        <StudentPanel user={user} token={token} logout={logout} />
      ) : user.role === 'professor' ? (
        <ProfessorPanel user={user} token={token} logout={logout} />
      ) : (
        <AdminPanel user={user} token={token} logout={logout} />
      )}
    </div>
  );
}
