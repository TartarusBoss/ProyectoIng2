import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_FILE = path.join(process.cwd(), '..', 'backend_data.sqlite');

async function backupAndClear() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('No existe el fichero de base de datos:', DB_FILE);
    process.exit(1);
  }

  const bak = DB_FILE + '.bak.' + Date.now();
  fs.copyFileSync(DB_FILE, bak);
  console.log('Backup creado en', bak);

  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  try {
    await db.exec('BEGIN TRANSACTION');
    // delete surveys and answers
    await db.exec('DELETE FROM survey_answers');
    await db.exec('DELETE FROM surveys');
    // reset sqlite_sequence for autoincrement
    await db.exec("UPDATE sqlite_sequence SET seq=0 WHERE name IN ('surveys','survey_answers')");
    await db.exec('COMMIT');
    console.log('Registros de encuestas y respuestas eliminados.');
  } catch (err) {
    await db.exec('ROLLBACK');
    console.error('Error al limpiar la base de datos:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

backupAndClear().catch(err => {
  console.error(err);
  process.exit(1);
});
