/**
 * PedaClic Pro Desktop — absencesService.ts
 * Suivi des absences et retards
 */
import { dbRun, dbAll } from './ipcDatabase';
import type { Absence } from '../types';

// ── Enregistrer une absence ────────────────────────────────
export async function createAbsence(data: {
  eleve_id: number;
  date_absence: string;
  heure_debut?: string;
  heure_fin?: string;
  motif?: string;
  justifiee?: boolean;
}): Promise<number> {
  const result = await dbRun(
    `INSERT INTO absences (eleve_id, date_absence, heure_debut, heure_fin, motif, justifiee)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.eleve_id,
      data.date_absence,
      data.heure_debut ?? null,
      data.heure_fin   ?? null,
      data.motif       ?? null,
      data.justifiee ? 1 : 0,
    ]
  );
  if (!result.success) throw new Error(result.error);
  return result.lastInsertRowid as number;
}

// ── Enregistrer absences en masse (appel du jour) ──────────
export async function saisirAbsencesMasse(
  date: string,
  absents: Array<{ eleve_id: number; heure_debut?: string; heure_fin?: string }>
): Promise<void> {
  for (const a of absents) {
    await createAbsence({ eleve_id: a.eleve_id, date_absence: date, ...a });
  }
}

// ── Absences d'un élève ────────────────────────────────────
export async function getAbsencesEleve(eleveId: number): Promise<Absence[]> {
  return dbAll<Absence>(
    `SELECT * FROM absences WHERE eleve_id = ? ORDER BY date_absence DESC`,
    [eleveId]
  );
}

// ── Absences d'une classe sur une période ─────────────────
export async function getAbsencesClasse(
  classeId: number,
  dateDebut?: string,
  dateFin?: string
): Promise<Array<Absence & { eleve_nom: string; eleve_prenom: string }>> {
  let sql = `
    SELECT a.*, e.nom as eleve_nom, e.prenom as eleve_prenom
    FROM absences a
    JOIN eleves e ON e.id = a.eleve_id
    WHERE e.classe_id = ? AND e.actif = 1
  `;
  const params: unknown[] = [classeId];

  if (dateDebut) { sql += ` AND a.date_absence >= ?`; params.push(dateDebut); }
  if (dateFin)   { sql += ` AND a.date_absence <= ?`; params.push(dateFin); }
  sql += ` ORDER BY a.date_absence DESC, e.nom`;

  return dbAll(sql, params);
}

// ── Absences du jour ───────────────────────────────────────
export async function getAbsencesAujourdhui(classeId: number): Promise<Array<Absence & { eleve_nom: string; eleve_prenom: string }>> {
  const today = new Date().toISOString().split('T')[0];
  return getAbsencesClasse(classeId, today, today);
}

// ── Justifier une absence ──────────────────────────────────
export async function justifierAbsence(id: number): Promise<void> {
  await dbRun(`UPDATE absences SET justifiee = 1 WHERE id = ?`, [id]);
}

// ── Supprimer une absence ──────────────────────────────────
export async function deleteAbsence(id: number): Promise<void> {
  await dbRun(`DELETE FROM absences WHERE id = ?`, [id]);
}

// ── Statistiques d'absences ────────────────────────────────
export interface StatsAbsences {
  total: number;
  justifiees: number;
  non_justifiees: number;
  heures_total: number;
}

export async function getStatsAbsencesEleve(
  eleveId: number,
  trimestre?: 1 | 2 | 3
): Promise<StatsAbsences> {
  // Calcul des trimestres sénégalais (approx.)
  const now = new Date();
  const year = now.getFullYear();

  const limitesT: Record<number, [string, string]> = {
    1: [`${year}-10-01`, `${year}-12-31`],
    2: [`${year + 1}-01-01`, `${year + 1}-03-31`],
    3: [`${year + 1}-04-01`, `${year + 1}-07-31`],
  };

  let sql = `SELECT justifiee, heure_debut, heure_fin FROM absences WHERE eleve_id = ?`;
  const params: unknown[] = [eleveId];

  if (trimestre) {
    const [debut, fin] = limitesT[trimestre];
    sql += ` AND date_absence BETWEEN ? AND ?`;
    params.push(debut, fin);
  }

  const rows = await dbAll<{ justifiee: number; heure_debut: string | null; heure_fin: string | null }>(sql, params);

  let heures_total = 0;
  for (const r of rows) {
    if (r.heure_debut && r.heure_fin) {
      const debut = r.heure_debut.split(':').map(Number);
      const fin   = r.heure_fin.split(':').map(Number);
      heures_total += (fin[0] * 60 + fin[1] - (debut[0] * 60 + debut[1])) / 60;
    } else {
      heures_total += 1; // 1h par défaut si heures non renseignées
    }
  }

  return {
    total: rows.length,
    justifiees:     rows.filter(r => r.justifiee === 1).length,
    non_justifiees: rows.filter(r => r.justifiee === 0).length,
    heures_total: Math.round(heures_total * 10) / 10,
  };
}