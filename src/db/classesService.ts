/**
 * PedaClic Pro Desktop — classesService.ts
 * CRUD complet pour la gestion des classes
 */
import { dbRun, dbGet, dbAll } from './ipcDatabase';
import type { Classe, NiveauScolaire } from '../types';

// ── Créer une classe ───────────────────────────────────────
export async function createClasse(data: {
  nom: string;
  niveau: NiveauScolaire;
  annee: string;
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO classes (nom, niveau, annee) VALUES (?, ?, ?)`,
    [data.nom, data.niveau, data.annee]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Lister toutes les classes ──────────────────────────────
export async function getClasses(annee?: string): Promise<Classe[]> {
  if (annee) {
    return dbAll<Classe>(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id AND e.actif = 1) as effectif
       FROM classes c WHERE c.annee = ? ORDER BY c.niveau, c.nom`,
      [annee]
    );
  }
  return dbAll<Classe>(
    `SELECT c.*,
      (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id AND e.actif = 1) as effectif
     FROM classes c ORDER BY c.annee DESC, c.niveau, c.nom`
  );
}

// ── Obtenir une classe par ID ──────────────────────────────
export async function getClasseById(id: number): Promise<Classe | null> {
  return dbGet<Classe>(
    `SELECT c.*,
      (SELECT COUNT(*) FROM eleves e WHERE e.classe_id = c.id AND e.actif = 1) as effectif
     FROM classes c WHERE c.id = ?`,
    [id]
  );
}

// ── Modifier une classe ────────────────────────────────────
export async function updateClasse(id: number, data: {
  nom?: string;
  niveau?: NiveauScolaire;
  annee?: string;
}): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.nom    !== undefined) { fields.push('nom = ?');    params.push(data.nom); }
  if (data.niveau !== undefined) { fields.push('niveau = ?'); params.push(data.niveau); }
  if (data.annee  !== undefined) { fields.push('annee = ?');  params.push(data.annee); }

  if (fields.length === 0) return;
  params.push(id);

  const result = await dbRun(
    `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (!result.success) throw new Error(result.error);
}

// ── Supprimer une classe (cascade sur élèves) ──────────────
export async function deleteClasse(id: number): Promise<void> {
  const result = await dbRun(`DELETE FROM classes WHERE id = ?`, [id]);
  if (!result.success) throw new Error(result.error);
}

// ── Années scolaires disponibles ──────────────────────────
export async function getAnneesDisponibles(): Promise<string[]> {
  const rows = await dbAll<{ annee: string }>(
    `SELECT DISTINCT annee FROM classes ORDER BY annee DESC`
  );
  return rows.map(r => r.annee);
}

// ── Niveaux scolaires (liste statique sénégalaise) ─────────
export const NIVEAUX: NiveauScolaire[] = [
  '6eme', '5eme', '4eme', '3eme', '2nde', '1ere', 'Tle'
];

export const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  '6eme': '6ème', '5eme': '5ème', '4eme': '4ème', '3eme': '3ème',
  '2nde': '2nde', '1ere': '1ère', 'Tle': 'Terminale',
};

// ── Année scolaire courante (calculée) ────────────────────
export function getAnneeScolaireCourante(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Au Sénégal, l'année scolaire commence en octobre
  return now.getMonth() >= 9
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}