/**
 * PedaClic Pro Desktop — disciplines.ts
 * Source canonique des matières/disciplines (alignée sur PedaClic web)
 * Utilisée par : IAPage, NotesPage, CahierPage, LoginPage
 */
export const DISCIPLINES = [
  'Mathématiques',
  'Français',
  'Physique-Chimie',
  'SVT',
  'Histoire-Géographie',
  'Anglais',
  'Arabe',
  'Espagnol',
  'Allemand',
  'Philosophie',
  'Sciences Économiques et Sociales',
  'Économie',
  'Informatique',
  'EPS',
  'Latin',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];
