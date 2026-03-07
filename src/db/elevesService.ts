/**
 * PedaClic Pro Desktop — elevesService.ts
 * CRUD complet pour la gestion des élèves
 */
import { dbRun, dbGet, dbAll } from './ipcDatabase';
import type { Eleve } from '../types';

// ── Créer un élève ─────────────────────────────────────────
export async function createEleve(data: {
  classe_id: number;
  nom: string;
  prenom: string;
  matricule?: string;
  date_naissance?: string;
  sexe?: 'M' | 'F';
  parent_nom?: string;
  parent_tel?: string;
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO eleves 
      (classe_id, nom, prenom, matricule, date_naissance, sexe, parent_nom, parent_tel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.classe_id,
      data.nom.toUpperCase().trim(),
      data.prenom.trim(),
      data.matricule ?? null,
      data.date_naissance ?? null,
      data.sexe ?? null,
      data.parent_nom ?? null,
      data.parent_tel ?? null,
    ]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Lister les élèves d'une classe ────────────────────────
export async function getElevesParClasse(classeId: number): Promise<Eleve[]> {
  return dbAll<Eleve>(
    `SELECT * FROM eleves 
     WHERE classe_id = ? AND actif = 1 
     ORDER BY nom, prenom`,
    [classeId]
  );
}

// ── Obtenir un élève par ID ────────────────────────────────
export async function getEleveById(id: number): Promise<Eleve | null> {
  return dbGet<Eleve>(`SELECT * FROM eleves WHERE id = ?`, [id]);
}

// ── Rechercher des élèves ──────────────────────────────────
export async function rechercherEleves(terme: string): Promise<Eleve[]> {
  const like = `%${terme.toLowerCase()}%`;
  return dbAll<Eleve>(
    `SELECT e.*, c.nom as classe_nom FROM eleves e
     LEFT JOIN classes c ON c.id = e.classe_id
     WHERE (LOWER(e.nom) LIKE ? OR LOWER(e.prenom) LIKE ? OR e.matricule LIKE ?)
     AND e.actif = 1
     ORDER BY e.nom, e.prenom
     LIMIT 50`,
    [like, like, like]
  );
}

// ── Modifier un élève ──────────────────────────────────────
export async function updateEleve(id: number, data: Partial<Omit<Eleve, 'id' | 'created_at'>>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    classe_id: data.classe_id,
    nom: data.nom !== undefined ? data.nom.toUpperCase().trim() : undefined,
    prenom: data.prenom !== undefined ? data.prenom.trim() : undefined,
    matricule: data.matricule,
    date_naissance: data.date_naissance,
    sexe: data.sexe,
    parent_nom: data.parent_nom,
    parent_tel: data.parent_tel,
    actif: data.actif,
  };

  for (const [key, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      params.push(val);
    }
  }

  if (fields.length === 0) return;
  params.push(id);

  const result = await dbRun(
    `UPDATE eleves SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  if (!result.success) throw new Error(result.error);
}

// ── Archiver un élève (soft delete) ───────────────────────
export async function archiverEleve(id: number): Promise<void> {
  await updateEleve(id, { actif: 0 });
}

// ── Supprimer définitivement ───────────────────────────────
export async function deleteEleve(id: number): Promise<void> {
  const result = await dbRun(`DELETE FROM eleves WHERE id = ?`, [id]);
  if (!result.success) throw new Error(result.error);
}

// ── Import en masse (liste de classe) ─────────────────────
export async function importerEleves(
  classeId: number,
  eleves: Array<{ nom: string; prenom: string; sexe?: 'M' | 'F'; matricule?: string }>
): Promise<{ success: number; errors: string[] }> {
  let success = 0;
  const errors: string[] = [];

  for (const eleve of eleves) {
    try {
      await createEleve({ ...eleve, classe_id: classeId });
      success++;
    } catch (err) {
      errors.push(`${eleve.prenom} ${eleve.nom} : ${(err as Error).message}`);
    }
  }

  return { success, errors };
}

// ── Statistiques d'une classe ──────────────────────────────
export async function getStatsClasse(classeId: number): Promise<{
  total: number;
  garcons: number;
  filles: number;
}> {
  const rows = await dbAll<{ sexe: string | null; count: number }>(
    `SELECT sexe, COUNT(*) as count FROM eleves 
     WHERE classe_id = ? AND actif = 1 GROUP BY sexe`,
    [classeId]
  );

  let total = 0, garcons = 0, filles = 0;
  for (const r of rows) {
    total += r.count;
    if (r.sexe === 'M') garcons = r.count;
    if (r.sexe === 'F') filles = r.count;
  }
  return { total, garcons, filles };
}