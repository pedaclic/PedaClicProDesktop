/** Types globaux PedaClic Pro Desktop */

export type NiveauScolaire = '6eme' | '5eme' | '4eme' | '3eme' | '2nde' | '1ere' | 'Tle';
export type TypeDevoir = 'Devoir' | 'Composition' | 'Interro' | 'TP';
export type Trimestre = 1 | 2 | 3;

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matiere: string;
  etablissement: string;
  created_at: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: NiveauScolaire;
  annee: string;
  effectif: number;
  created_at: string;
}

export interface Eleve {
  id: number;
  classe_id: number;
  nom: string;
  prenom: string;
  matricule?: string;
  date_naissance?: string;
  sexe?: 'M' | 'F';
  parent_nom?: string;
  parent_tel?: string;
  actif: number;
  created_at: string;
}

export interface Absence {
  id: number;
  eleve_id: number;
  date_absence: string;
  heure_debut?: string;
  heure_fin?: string;
  motif?: string;
  justifiee: number;
  created_at: string;
}

export interface Note {
  id: number;
  eleve_id: number;
  matiere: string;
  type_devoir: TypeDevoir;
  intitule?: string;
  note: number;
  coefficient: number;
  date_devoir: string;
  trimestre: Trimestre;
  created_at: string;
}

export interface Sequence {
  id: number;
  titre: string;
  matiere: string;
  niveau: NiveauScolaire;
  objectifs?: string;
  duree_heures: number;
  contenu?: string;
  created_at: string;
}

export interface CahierTextes {
  id: number;
  classe_id: number;
  matiere: string;
  annee: string;
  created_at: string;
}

export interface EntreeCahier {
  id: number;
  cahier_id: number;
  date_seance: string;
  titre: string;
  contenu?: string;
  devoirs?: string;
  sequence_id?: number;
  created_at: string;
}

export interface Licence {
  id: number;
  cle: string;
  statut: 'inactive' | 'active' | 'revoked';
  machine_id?: string;
  activated_at?: string;
  expires_at?: string;
}

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  changes?: number;
  lastInsertRowid?: number;
}