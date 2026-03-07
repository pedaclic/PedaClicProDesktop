/**
 * PedaClic Pro Desktop — electron/db-init.ts
 * Initialise le schéma SQLite au premier lancement
 * Toutes les tables de pedaclic_pro.db
 */
import Database from 'better-sqlite3';

export async function initDatabase(dbPath: string): Promise<void> {
  const db = new Database(dbPath);

  // Optimisations performance SQLite
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    -- ══════════════════════════════════════════════════════
    -- TABLE : utilisateur (profil de l'enseignant)
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS utilisateur (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nom           TEXT NOT NULL,
      prenom        TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password      TEXT NOT NULL,        -- bcrypt hash
      matiere       TEXT DEFAULT '',
      etablissement TEXT DEFAULT '',
      email_verified INTEGER DEFAULT 1,   -- 1 = vérifié (comptes existants), 0 = en attente
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- Table des tokens de vérification d'email (sécurité)
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_email_verification_user  ON email_verification_tokens(utilisateur_id);

    -- ══════════════════════════════════════════════════════
    -- TABLE : licence
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS licence (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cle             TEXT UNIQUE NOT NULL,
      statut          TEXT NOT NULL DEFAULT 'inactive',
      machine_id      TEXT,
      activated_at    TEXT,
      expires_at      TEXT,    -- NULL = perpétuelle
      utilisateur_id  INTEGER REFERENCES utilisateur(id)
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : classes
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS classes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nom       TEXT NOT NULL,
      niveau    TEXT NOT NULL,
      annee     TEXT NOT NULL DEFAULT '2024-2025',
      effectif  INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : eleves
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS eleves (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      classe_id       INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      nom             TEXT NOT NULL,
      prenom          TEXT NOT NULL,
      matricule       TEXT UNIQUE,
      date_naissance  TEXT,
      sexe            TEXT CHECK(sexe IN ('M','F')),
      parent_nom      TEXT,
      parent_tel      TEXT,
      actif           INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : absences
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS absences (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      eleve_id      INTEGER NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
      date_absence  TEXT NOT NULL,
      heure_debut   TEXT,
      heure_fin     TEXT,
      motif         TEXT,
      justifiee     INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : notes
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS notes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      eleve_id      INTEGER NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
      matiere       TEXT NOT NULL,
      type_devoir   TEXT NOT NULL,
      intitule      TEXT,
      note          REAL NOT NULL CHECK(note >= 0 AND note <= 20),
      coefficient   REAL NOT NULL DEFAULT 1,
      date_devoir   TEXT NOT NULL,
      trimestre     INTEGER NOT NULL CHECK(trimestre IN (1,2,3)),
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : cahiers_textes
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS cahiers_textes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      classe_id   INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      matiere     TEXT NOT NULL,
      annee       TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : sequences (avant entrees_cahier car FK reference)
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS sequences (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      titre         TEXT NOT NULL,
      matiere       TEXT NOT NULL,
      niveau        TEXT NOT NULL,
      objectifs     TEXT,
      duree_heures  INTEGER DEFAULT 1,
      contenu       TEXT,   -- JSON stringifié
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : entrees_cahier
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS entrees_cahier (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      cahier_id     INTEGER NOT NULL REFERENCES cahiers_textes(id) ON DELETE CASCADE,
      date_seance   TEXT NOT NULL,
      titre         TEXT NOT NULL,
      contenu       TEXT,
      devoirs       TEXT,
      sequence_id   INTEGER REFERENCES sequences(id),
      created_at    TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- TABLE : generated_content (cache IA local)
    -- ══════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS generated_content (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT NOT NULL,
      matiere     TEXT NOT NULL,
      niveau      TEXT NOT NULL,
      prompt      TEXT NOT NULL,
      contenu     TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ══════════════════════════════════════════════════════
    -- INDEX pour les requêtes fréquentes
    -- ══════════════════════════════════════════════════════
    CREATE INDEX IF NOT EXISTS idx_eleves_classe   ON eleves(classe_id);
    CREATE INDEX IF NOT EXISTS idx_notes_eleve     ON notes(eleve_id);
    CREATE INDEX IF NOT EXISTS idx_absences_eleve  ON absences(eleve_id);
    CREATE INDEX IF NOT EXISTS idx_entrees_cahier  ON entrees_cahier(cahier_id);
  `);

  // Migration : ajouter email_verified aux bases existantes (comptes existants = vérifiés)
  try {
    db.prepare('SELECT email_verified FROM utilisateur LIMIT 1').get();
  } catch {
    db.exec(`ALTER TABLE utilisateur ADD COLUMN email_verified INTEGER DEFAULT 1`);
    db.exec(`UPDATE utilisateur SET email_verified = 1 WHERE email_verified IS NULL`);
    console.log('[DB] Migration : colonne email_verified ajoutée');
  }

  db.close();
  console.log('[DB] Schéma initialisé :', dbPath);
}