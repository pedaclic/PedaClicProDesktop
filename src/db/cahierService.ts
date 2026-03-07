/**
 * PedaClic Pro Desktop — cahierService.ts
 * Cahier de textes numérique + Séquences pédagogiques
 */
import { dbRun, dbGet, dbAll } from './ipcDatabase';
import type { CahierTextes, EntreeCahier, Sequence } from '../types';

// ════════════════════════════════════════════════════════════
// CAHIERS DE TEXTES
// ════════════════════════════════════════════════════════════

// ── Créer un cahier ────────────────────────────────────────
export async function createCahier(data: {
  classe_id: number;
  matiere: string;
  annee: string;
}): Promise<number> {
  // Vérifier qu'il n'existe pas déjà pour cette classe/matière/année
  const existing = await dbGet(
    `SELECT id FROM cahiers_textes WHERE classe_id = ? AND matiere = ? AND annee = ?`,
    [data.classe_id, data.matiere, data.annee]
  );
  if (existing) throw new Error('Un cahier existe déjà pour cette classe et cette matière');

  const result = await dbRun(
    `INSERT INTO cahiers_textes (classe_id, matiere, annee) VALUES (?, ?, ?)`,
    [data.classe_id, data.matiere, data.annee]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Lister les cahiers ─────────────────────────────────────
export async function getCahiers(classeId?: number): Promise<Array<CahierTextes & { classe_nom: string; nb_entrees: number }>> {
  let sql = `
    SELECT ct.*, c.nom as classe_nom,
      (SELECT COUNT(*) FROM entrees_cahier e WHERE e.cahier_id = ct.id) as nb_entrees
    FROM cahiers_textes ct
    LEFT JOIN classes c ON c.id = ct.classe_id
  `;
  const params: unknown[] = [];
  if (classeId) { sql += ` WHERE ct.classe_id = ?`; params.push(classeId); }
  sql += ` ORDER BY ct.annee DESC, c.nom, ct.matiere`;
  return dbAll(sql, params);
}

// ── Obtenir un cahier ──────────────────────────────────────
export async function getCahierById(id: number): Promise<CahierTextes | null> {
  return dbGet<CahierTextes>(`SELECT * FROM cahiers_textes WHERE id = ?`, [id]);
}

// ── Supprimer un cahier (cascade sur entrées) ──────────────
export async function deleteCahier(id: number): Promise<void> {
  await dbRun(`DELETE FROM cahiers_textes WHERE id = ?`, [id]);
}

// ════════════════════════════════════════════════════════════
// ENTRÉES DU CAHIER
// ════════════════════════════════════════════════════════════

// ── Créer une entrée ───────────────────────────────────────
export async function createEntree(data: {
  cahier_id: number;
  date_seance: string;
  titre: string;
  contenu?: string;
  devoirs?: string;
  sequence_id?: number;
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO entrees_cahier (cahier_id, date_seance, titre, contenu, devoirs, sequence_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.cahier_id, data.date_seance, data.titre,
      data.contenu    ?? null,
      data.devoirs    ?? null,
      data.sequence_id ?? null,
    ]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Lister les entrées d'un cahier ────────────────────────
export async function getEntreesCahier(cahierId: number): Promise<EntreeCahier[]> {
  return dbAll<EntreeCahier>(
    `SELECT * FROM entrees_cahier WHERE cahier_id = ? ORDER BY date_seance DESC`,
    [cahierId]
  );
}

// ── Modifier une entrée ────────────────────────────────────
export async function updateEntree(id: number, data: {
  titre?: string;
  contenu?: string;
  devoirs?: string;
  date_seance?: string;
}): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.titre       !== undefined) { fields.push('titre = ?');       params.push(data.titre); }
  if (data.contenu     !== undefined) { fields.push('contenu = ?');     params.push(data.contenu); }
  if (data.devoirs     !== undefined) { fields.push('devoirs = ?');     params.push(data.devoirs); }
  if (data.date_seance !== undefined) { fields.push('date_seance = ?'); params.push(data.date_seance); }

  if (fields.length === 0) return;
  params.push(id);
  await dbRun(`UPDATE entrees_cahier SET ${fields.join(', ')} WHERE id = ?`, params);
}

// ── Supprimer une entrée ───────────────────────────────────
export async function deleteEntree(id: number): Promise<void> {
  await dbRun(`DELETE FROM entrees_cahier WHERE id = ?`, [id]);
}

// ════════════════════════════════════════════════════════════
// SÉQUENCES PÉDAGOGIQUES
// ════════════════════════════════════════════════════════════

// ── Créer une séquence ─────────────────────────────────────
export async function createSequence(data: {
  titre: string;
  matiere: string;
  niveau: string;
  objectifs?: string;
  duree_heures?: number;
  contenu?: string;
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO sequences (titre, matiere, niveau, objectifs, duree_heures, contenu)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.titre, data.matiere, data.niveau,
      data.objectifs   ?? null,
      data.duree_heures ?? 1,
      data.contenu     ? JSON.stringify(data.contenu) : null,
    ]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Lister les séquences ───────────────────────────────────
export async function getSequences(matiere?: string, niveau?: string): Promise<Sequence[]> {
  let sql = `SELECT * FROM sequences WHERE 1=1`;
  const params: unknown[] = [];
  if (matiere) { sql += ` AND matiere = ?`; params.push(matiere); }
  if (niveau)  { sql += ` AND niveau = ?`;  params.push(niveau); }
  sql += ` ORDER BY created_at DESC`;
  return dbAll<Sequence>(sql, params);
}

// ── Obtenir une séquence ───────────────────────────────────
export async function getSequenceById(id: number): Promise<Sequence | null> {
  return dbGet<Sequence>(`SELECT * FROM sequences WHERE id = ?`, [id]);
}

// ── Modifier une séquence ──────────────────────────────────
export async function updateSequence(id: number, data: Partial<Omit<Sequence, 'id' | 'created_at'>>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    titre: data.titre, matiere: data.matiere, niveau: data.niveau,
    objectifs: data.objectifs, duree_heures: data.duree_heures, contenu: data.contenu,
  };

  for (const [key, val] of Object.entries(map)) {
    if (val !== undefined) { fields.push(`${key} = ?`); params.push(val); }
  }

  if (fields.length === 0) return;
  params.push(id);
  await dbRun(`UPDATE sequences SET ${fields.join(', ')} WHERE id = ?`, params);
}

// ── Supprimer une séquence ─────────────────────────────────
export async function deleteSequence(id: number): Promise<void> {
  await dbRun(`DELETE FROM sequences WHERE id = ?`, [id]);
}