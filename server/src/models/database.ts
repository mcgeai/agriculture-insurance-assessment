import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const DB_DIR = path.dirname(config.db.path);

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(config.db.path);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const db = getDb();
  const initSql = fs.readFileSync(path.join(__dirname, '../../database/init.sql'), 'utf-8');
  db.exec(initSql);
  console.log('Database tables initialized.');
}

export function seedDb(): void {
  const db = getDb();
  db.exec('DELETE FROM dimension_scores; DELETE FROM answers; DELETE FROM questions; DELETE FROM assessments;');
  const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf-8');
  db.exec(seedSql);
  console.log('Seed data inserted.');
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
