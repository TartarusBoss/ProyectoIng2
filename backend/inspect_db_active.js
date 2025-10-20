import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'backend_data.sqlite');

async function listTables() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  try {
    const tables = await db.all("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','view') ORDER BY name");
    console.log('Inspectando:', DB_FILE);
    console.log('Tablas/Views encontradas:', tables.map(t => t.name));
    for (const t of tables) {
      try {
        const row = await db.get(`SELECT COUNT(*) as c FROM ${t.name}`);
        console.log(`${t.name}: ${row ? row.c : 'N/A'} filas`);
      } catch (err) {
        console.log(`${t.name}: no se puede contar filas (${err.message})`);
      }
    }
  } catch (err) {
    console.error('Error consultando sqlite_master:', err.message);
  } finally {
    await db.close();
  }
}

listTables().catch(err => { console.error(err); process.exit(1); });
