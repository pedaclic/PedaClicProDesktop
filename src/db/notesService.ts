/**
 * PedaClic Pro Desktop — notesService.ts
 * Saisie des notes + calcul automatique des moyennes
 */
import { dbRun, dbGet, dbAll } from './ipcDatabase';
import type { Note, TypeDevoir, Trimestre } from '../types';

// ── Créer une note ─────────────────────────────────────────
export async function createNote(data: {
  eleve_id: number;
  matiere: string;
  type_devoir: TypeDevoir;
  intitule?: string;
  note: number;
  coefficient: number;
  date_devoir: string;
  trimestre: Trimestre;
}): Promise<number> {
  if (data.note < 0 || data.note > 20)
    throw new Error('La note doit être comprise entre 0 et 20');

  const result = await dbRun(
    `INSERT INTO notes 
      (eleve_id, matiere, type_devoir, intitule, note, coefficient, date_devoir, trimestre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.eleve_id, data.matiere, data.type_devoir,
      data.intitule ?? null, data.note, data.coefficient,
      data.date_devoir, data.trimestre,
    ]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Saisie en masse (notes d'un devoir pour toute la classe) 
export async function saisirNotesMasse(devoir: {
  matiere: string;
  type_devoir: TypeDevoir;
  intitule: string;
  date_devoir: string;
  trimestre: Trimestre;
  coefficient: number;
}, notes: Array<{ eleve_id: number; note: number }>): Promise<void> {
  for (const n of notes) {
    if (n.note < 0 || n.note > 20) continue; // Ignorer notes invalides
    await createNote({ ...devoir, eleve_id: n.eleve_id, note: n.note });
  }
}

// ── Notes d'un élève ───────────────────────────────────────
export async function getNotesEleve(
  eleveId: number,
  trimestre?: Trimestre,
  matiere?: string
): Promise<Note[]> {
  let sql = `SELECT * FROM notes WHERE eleve_id = ?`;
  const params: unknown[] = [eleveId];

  if (trimestre) { sql += ` AND trimestre = ?`; params.push(trimestre); }
  if (matiere)   { sql += ` AND matiere = ?`;   params.push(matiere); }

  sql += ` ORDER BY date_devoir DESC`;
  return dbAll<Note>(sql, params);
}

// ── Notes d'une classe pour un devoir ─────────────────────
export async function getNotesClasse(
  classeId: number,
  matiere: string,
  trimestre: Trimestre
): Promise<Array<Note & { eleve_nom: string; eleve_prenom: string }>> {
  return dbAll(
    `SELECT n.*, e.nom as eleve_nom, e.prenom as eleve_prenom
     FROM notes n
     JOIN eleves e ON e.id = n.eleve_id
     WHERE e.classe_id = ? AND n.matiere = ? AND n.trimestre = ? AND e.actif = 1
     ORDER BY e.nom, e.prenom, n.date_devoir DESC`,
    [classeId, matiere, trimestre]
  );
}

// ── Calcul moyenne d'un élève ──────────────────────────────
export async function calculerMoyenneEleve(
  eleveId: number,
  trimestre: Trimestre,
  matiere?: string
): Promise<number | null> {
  let sql = `SELECT note, coefficient FROM notes WHERE eleve_id = ? AND trimestre = ?`;
  const params: unknown[] = [eleveId, trimestre];
  if (matiere) { sql += ` AND matiere = ?`; params.push(matiere); }

  const notes = await dbAll<{ note: number; coefficient: number }>(sql, params);
  if (notes.length === 0) return null;

  const totalPoints = notes.reduce((sum, n) => sum + n.note * n.coefficient, 0);
  const totalCoeff  = notes.reduce((sum, n) => sum + n.coefficient, 0);

  return totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : null;
}

// ── Bulletin d'une classe ──────────────────────────────────
export interface BulletinEleve {
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  moyenne_generale: number | null;
  moyennes_matieres: Record<string, number | null>;
  rang: number;
}

export async function getBulletinClasse(
  classeId: number,
  trimestre: Trimestre
): Promise<BulletinEleve[]> {
  // Récupérer tous les élèves de la classe
  const eleves = await dbAll<{ id: number; nom: string; prenom: string }>(
    `SELECT id, nom, prenom FROM eleves WHERE classe_id = ? AND actif = 1 ORDER BY nom`,
    [classeId]
  );

  // Récupérer toutes les matières de la classe
  const matieresRows = await dbAll<{ matiere: string }>(
    `SELECT DISTINCT n.matiere FROM notes n
     JOIN eleves e ON e.id = n.eleve_id
     WHERE e.classe_id = ? AND n.trimestre = ?
     ORDER BY n.matiere`,
    [classeId, trimestre]
  );
  const matieres = matieresRows.map(r => r.matiere);

  // Calculer les moyennes pour chaque élève
  const bulletins: BulletinEleve[] = [];

  for (const eleve of eleves) {
    const moyennes_matieres: Record<string, number | null> = {};

    for (const matiere of matieres) {
      moyennes_matieres[matiere] = await calculerMoyenneEleve(eleve.id, trimestre, matiere);
    }

    const valeurs = Object.values(moyennes_matieres).filter(v => v !== null) as number[];
    const moyenne_generale = valeurs.length > 0
      ? Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length * 100) / 100
      : null;

    bulletins.push({ eleve_id: eleve.id, eleve_nom: eleve.nom, eleve_prenom: eleve.prenom, moyenne_generale, moyennes_matieres, rang: 0 });
  }

  // Calculer les rangs
  const tries = [...bulletins].sort((a, b) => (b.moyenne_generale ?? -1) - (a.moyenne_generale ?? -1));
  tries.forEach((b, i) => { b.rang = i + 1; });

  return bulletins.sort((a, b) => a.eleve_nom.localeCompare(b.eleve_nom));
}

// ── Modifier une note ──────────────────────────────────────
export async function updateNote(id: number, data: {
  note?: number;
  coefficient?: number;
  intitule?: string;
}): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.note !== undefined) {
    if (data.note < 0 || data.note > 20) throw new Error('Note invalide');
    fields.push('note = ?'); params.push(data.note);
  }
  if (data.coefficient !== undefined) { fields.push('coefficient = ?'); params.push(data.coefficient); }
  if (data.intitule    !== undefined) { fields.push('intitule = ?');    params.push(data.intitule); }

  if (fields.length === 0) return;
  params.push(id);

  await dbRun(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, params);
}

// ── Supprimer une note ─────────────────────────────────────
export async function deleteNote(id: number): Promise<void> {
  await dbRun(`DELETE FROM notes WHERE id = ?`, [id]);
}

// ── Types de devoirs disponibles ──────────────────────────
export const TYPES_DEVOIRS: TypeDevoir[] = ['Devoir', 'Composition', 'Interro', 'TP'];
export const TRIMESTRES: Trimestre[] = [1, 2, 3];