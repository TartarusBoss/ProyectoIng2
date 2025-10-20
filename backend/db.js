// backend/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

const DB_FILE = path.join(process.cwd(), "backend_data.sqlite");

export async function initDb() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject_id INTEGER,
      survey_type TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS survey_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER,
      question_index INTEGER,
      question_text TEXT,
      answer TEXT,
      comment TEXT
    );
  `);

  // seed users & subjects if not exist
  const admin = await db.get("SELECT * FROM users WHERE username = 'admin'");
  if (!admin) {
    const bcrypt = await import("bcrypt");
    const hashAdmin = await bcrypt.hash("admin123", 10);
    await db.run(
      "INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)",
      ["admin", hashAdmin, "admin", "Administrador"]
    );
  }

  // 3 professors
  for (let i = 1; i <= 3; i++) {
    const uname = `prof${i}`;
    const exists = await db.get("SELECT * FROM users WHERE username = ?", uname);
    if (!exists) {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash(`prof${i}123`, 10);
      await db.run(
        "INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)",
        [uname, hash, "professor", `Profesor ${i}`]
      );
    }
  }

  // 3 students
  for (let i = 1; i <= 3; i++) {
    const uname = `stud${i}`;
    const exists = await db.get("SELECT * FROM users WHERE username = ?", uname);
    if (!exists) {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash(`stud${i}123`, 10);
      await db.run(
        "INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)",
        [uname, hash, "student", `Estudiante ${i}`]
      );
    }
  }

  // subjects (3)
  const count = await db.get("SELECT COUNT(*) as c FROM subjects");
  if (!count || count.c === 0) {
    await db.run("INSERT INTO subjects (name) VALUES (?)", ["Matemáticas"]);
    await db.run("INSERT INTO subjects (name) VALUES (?)", ["Física"]);
    await db.run("INSERT INTO subjects (name) VALUES (?)", ["Programación"]);
  }

  return db;
}
