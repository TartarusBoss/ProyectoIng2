import React from "react";
import { exportResults } from "../api";

export default function ExportButton({ token }) {
  const handleExport = async () => {
    try {
      const res = await exportResults(token);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reporte.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Error al exportar");
    }
  };

  return <button onClick={handleExport}>📤 Exportar a Excel</button>;
}
