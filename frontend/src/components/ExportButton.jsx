import { exportResults } from "../api";

export default function ExportButton() {
  const handleExport = async () => {
    const res = await exportResults();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte.xlsx");
    document.body.appendChild(link);
    link.click();
  };

  return <button onClick={handleExport}>📤 Exportar a Excel</button>;
}
