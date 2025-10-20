ProyectoIng2 — Instrucciones para ejecutar y entregar

Resumen
-------
Pequeño monorepo con backend (Express + SQLite) y frontend (React + Vite).
Este README explica cómo preparar y entregar el proyecto a otra persona, y cómo ejecutar el proyecto en una máquina Windows.

Requisitos mínimos en la máquina del receptor
---------------------------------------------
- Node.js LTS (>= 18) y npm instalados: https://nodejs.org/
- (Opcional pero recomendado) Visual Studio Code para editar/ejecutar el proyecto. Si la otra persona tiene "Visual Studio" (IDE) puede usarlo, pero igualmente necesitará Node.js.

Archivos y estructura importante
-------------------------------
- backend/
  - server.js — servidor Express
  - db.js — inicialización y seed de la DB SQLite (archivo: backend_data.sqlite)
  - routes/ — rutas API
- frontend/
  - src/ — código React + Vite
  - package.json — scripts de frontend
- backend_data.sqlite — base de datos SQLite en la raíz del proyecto (si existe)
- scripts/reset_db.js — script para vaciar tablas de encuestas (crea backup antes)

Pasos para preparar el proyecto (recomendado antes de entregar)
---------------------------------------------------------------
1) Instalar dependencias (en Windows PowerShell):

```powershell
# en la raíz del repo (si hay package.json en root con workspaces, sino solo backend/frontend):
cd .\backend
npm install

cd ..\frontend
npm install
```

2) (Opcional) Generar build de producción del frontend si quieres entregar una versión estática:

```powershell
cd .\frontend
npm run build
# la carpeta dist/ contendrá la versión lista para servir
```

3) Incluir la base de datos o dejar que se genere:
- Si quieres que la otra persona comience con los datos actuales, incluye `backend_data.sqlite` en el paquete.
- Si prefieres que el receptor empiece "limpio", indícale que ejecute el script de reinicio o que borre `backend_data.sqlite` antes de levantar el servidor.

Cómo ejecutar (desarrollo)
--------------------------
1) Backend
```powershell
cd .\backend
node server.js
# Servidor en http://localhost:4000
```

2) Frontend (Vite)
```powershell
cd .\frontend
npm run dev
# Vite típicamente abre http://localhost:5173
```

Asegúrate de que ambos puertos estén libres. Si cambias puertos, actualiza las URL en el frontend (si se usan hard-coded) o configura variables de entorno.

Reiniciar (limpiar) la base de datos de encuestas (seguro)
---------------------------------------------------------
Si quieres vaciar solo los datos de encuestas (manteniendo usuarios y materias):

```powershell
# desde la raíz del repo
node .\scripts\reset_db.js
```

El script hará:
- Crear una copia de seguridad `backend_data.sqlite.bak.<timestamp>` en la misma carpeta.
- Borrar los registros de `survey_answers` y `surveys`.
- Resetear las secuencias de autoincremento para las tablas afectadas.

Si prefieres eliminar todo y recrear (seed desde `db.js`):
```powershell
copy .\backend_data.sqlite .\backend_data.sqlite.bak
del .\backend_data.sqlite
# luego inicia el backend y se recrearán las tablas/usuarios/subjects
node .\backend\server.js
```

Empaquetado / entrega
---------------------
1) Git (recomendado): sube el repo a GitHub / GitLab y comparte el enlace. Incluye instrucciones de ejecución (este README).
2) ZIP: compacta la carpeta del proyecto incluyendo `backend_data.sqlite` si quieres que la persona tenga los datos actuales:

```powershell
# desde la carpeta que contiene el proyecto
Compress-Archive -Path .\"ProyectoIng2 - copia" -DestinationPath .\ProyectoIng2.zip -Force
```

Notas para el receptor (lo esencial que debe hacer)
--------------------------------------------------
1) Instalar Node.js (si no lo tiene).
2) Abrir PowerShell, navegar al proyecto.
3) Ejecutar `npm install` en `backend` y `frontend`.
4) (Opcional) `node .\scripts\reset_db.js` para limpiar encuestas si lo desea.
5) Levantar backend y frontend con los comandos indicados.

Consejos y advertencias
-----------------------
- El backend utiliza `backend_data.sqlite` en la raíz del repo. No lo borres si necesitas conservar datos; el script `reset_db.js` hace backup.
- Si la persona usa Windows y Visual Studio (IDE), eso no sustituye la instalación de Node.js. Asegúrate de indicarle que instale Node.
- Para producción considera crear un `docker-compose` que incluya el backend + nginx estático; eso facilita la entrega, pero no lo añadí automáticamente.

¿Quieres que lo empaquete por ti o que ejecute el script ahora?
------------------------------------------------------------
Puedo ejecutar aquí el script `node .\scripts\reset_db.js` para crear el backup y limpiar las encuestas. Dime "Ejecuta reset" y lo corro; te mostraré la salida. Si prefieres que te prepare un ZIP o un commit con este README incluido, dime y lo genero.

---
Fechas y autor: documento generado automáticamente para entrega del proyecto.
