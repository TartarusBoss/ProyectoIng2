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

  // Add teacher_id to subjects if not present (non-destructive)
  const subjInfo = await db.all("PRAGMA table_info(subjects)");
  if (!subjInfo.find(c => c.name === 'teacher_id')) {
    await db.exec(`ALTER TABLE subjects ADD COLUMN teacher_id INTEGER`);
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject_id INTEGER,
      survey_type TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add teacher_rating to surveys if not present (stores 1-5 star rating given by student)
  const surveyInfo = await db.all("PRAGMA table_info(surveys)");
  if (!surveyInfo.find(c => c.name === 'teacher_rating')) {
    await db.exec(`ALTER TABLE surveys ADD COLUMN teacher_rating INTEGER`);
  }

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

  // Ensure subjects exist and are assigned to professors. This is idempotent
  // Lookup professor ids by username so we can assign subjects to professors
  const prof1 = await db.get("SELECT id FROM users WHERE username = ?", "prof1");
  const prof2 = await db.get("SELECT id FROM users WHERE username = ?", "prof2");
  const prof3 = await db.get("SELECT id FROM users WHERE username = ?", "prof3");

  const subjectsToEnsure = [
    { name: "Matemáticas", teacher_id: prof1?.id || null },
    { name: "Física", teacher_id: prof1?.id || null },
    { name: "Programación", teacher_id: prof1?.id || null },

    { name: "Proyecto de Ingenieria", teacher_id: prof2?.id || null },
    { name: "Fisica 2", teacher_id: prof2?.id || null },
    { name: "Desarrollo Web", teacher_id: prof2?.id || null },

    { name: "Biologia", teacher_id: prof3?.id || null },
    { name: "Fisica", teacher_id: prof3?.id || null },
    { name: "Quimica", teacher_id: prof3?.id || null }
  ];

  for (const s of subjectsToEnsure) {
    const existing = await db.get("SELECT * FROM subjects WHERE name = ?", s.name);
    if (existing) {
      // If subject exists but has no teacher assigned, set it (don't overwrite an existing assignment)
      if ((existing.teacher_id === null || existing.teacher_id === undefined) && s.teacher_id) {
        await db.run("UPDATE subjects SET teacher_id = ? WHERE id = ?", s.teacher_id, existing.id);
      }
    } else {
      await db.run("INSERT INTO subjects (name, teacher_id) VALUES (?,?)", s.name, s.teacher_id);
    }
  }

  return db;
}
