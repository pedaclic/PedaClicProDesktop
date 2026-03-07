// ============================================================
// PedaClic Pro Desktop — Export PDF : Types
// Bulletin scolaire, Liste de classe, Cahier de textes
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================

// ------------------------------------------------------------
// ÉTABLISSEMENT
// Informations de l'école affichées en en-tête des documents
// ------------------------------------------------------------
export interface InfoEtablissement {
  /** Nom complet de l'établissement */
  nom: string;
  /** Adresse physique */
  adresse: string;
  /** Ville (ex: Dakar, Thiès, Saint-Louis) */
  ville: string;
  /** Numéro de téléphone */
  telephone?: string;
  /** Email de l'établissement */
  email?: string;
  /** Année scolaire (ex: 2024-2025) */
  anneeScolaire: string;
}

// ------------------------------------------------------------
// BULLETIN SCOLAIRE
// Un bulletin par élève, par trimestre
// ------------------------------------------------------------

/** Note d'une matière dans le bulletin */
export interface NoteMatiere {
  /** Nom de la matière (ex: Mathématiques, Français) */
  matiere: string;
  /** Coefficient de la matière */
  coefficient: number;
  /** Note de l'élève sur 20 */
  note: number | null;
  /** Moyenne générale de la classe pour cette matière */
  moyenneClasse?: number;
  /** Rang de l'élève dans cette matière */
  rang?: number;
  /** Appréciation du professeur */
  appreciation?: string;
  /** Nom du professeur */
  nomProf?: string;
}

/** Données complètes pour générer un bulletin */
export interface DonneesBulletin {
  /** Informations de l'établissement */
  etablissement: InfoEtablissement;
  /** Trimestre (1, 2 ou 3) */
  trimestre: 1 | 2 | 3;
  /** Informations de l'élève */
  eleve: {
    nom: string;
    prenom: string;
    /** Matricule de l'élève */
    matricule?: string;
    /** Classe (ex: 3ème A, Terminale S) */
    classe: string;
    /** Date de naissance */
    dateNaissance?: string;
    /** Lieu de naissance */
    lieuNaissance?: string;
  };
  /** Liste des notes par matière */
  notes: NoteMatiere[];
  /** Résultats globaux */
  resultats: {
    /** Moyenne générale de l'élève */
    moyenneGenerale: number;
    /** Rang dans la classe */
    rangClasse: number;
    /** Effectif total de la classe */
    effectifClasse: number;
    /** Moyenne générale de la classe */
    moyenneClasse: number;
    /** Mention (ex: Passable, Assez Bien, Bien, Très Bien) */
    mention: string;
    /** Appréciation du conseil de classe */
    appreciationConseil?: string;
  };
  /** Absences du trimestre */
  absences: {
    /** Nombre total d'absences en heures */
    totalHeures: number;
    /** Dont absences non justifiées */
    nonJustifiees: number;
  };
  /** Décision du conseil (Admis, Redoublement, etc.) */
  decision?: string;
  /** Date d'édition du bulletin */
  dateEdition: string;
}

// ------------------------------------------------------------
// LISTE DE CLASSE
// Utilisée pour l'appel et les feuilles de composition
// ------------------------------------------------------------

/** Un élève dans la liste de classe */
export interface EleveListeClasse {
  /** Numéro d'ordre dans la liste */
  numero: number;
  /** Matricule de l'élève */
  matricule?: string;
  nom: string;
  prenom: string;
  /** Sexe : M ou F */
  sexe: 'M' | 'F';
  /** Date de naissance au format DD/MM/YYYY */
  dateNaissance?: string;
  /** Redoublant cette année */
  redoublant?: boolean;
}

/** Type de liste à générer */
export type TypeListeClasse =
  | 'appel'        // Liste d'appel journalière avec cases à cocher
  | 'composition'  // Feuille de composition avec colonnes de notes
  | 'complete';    // Liste complète avec toutes les infos

/** Données pour générer une liste de classe */
export interface DonneesListeClasse {
  etablissement: InfoEtablissement;
  /** Nom de la classe */
  classe: string;
  /** Nom du professeur principal */
  professeurPrincipal?: string;
  /** Matière concernée (pour feuille de composition) */
  matiere?: string;
  /** Type de document */
  typeDocument: TypeListeClasse;
  /** Liste des élèves triée par nom */
  eleves: EleveListeClasse[];
  /** Date (pour liste d'appel) */
  date?: string;
  /** Trimestre (pour feuille de composition) */
  trimestre?: 1 | 2 | 3;
}

// ------------------------------------------------------------
// CAHIER DE TEXTES
// Export d'une période pour inspection ou archivage
// ------------------------------------------------------------

/** Une séance dans le cahier de textes */
export interface SeanceCahier {
  /** Date de la séance au format DD/MM/YYYY */
  date: string;
  /** Horaire (ex: 08h00 - 10h00) */
  horaire?: string;
  /** Durée en heures */
  duree?: number;
  /** Titre / intitulé de la séance */
  titre: string;
  /** Contenu détaillé de la séance */
  contenu: string;
  /** Travail à faire pour la prochaine séance */
  travailFaire?: string;
  /** Observations particulières */
  observations?: string;
}

/** Données pour exporter le cahier de textes */
export interface DonneesCahierTextes {
  etablissement: InfoEtablissement;
  /** Matière concernée */
  matiere: string;
  /** Classe concernée */
  classe: string;
  /** Nom du professeur */
  nomProf: string;
  /** Année scolaire */
  anneeScolaire: string;
  /** Trimestre ou période */
  periode: string;
  /** Liste des séances triées par date */
  seances: SeanceCahier[];
  /** Nombre total d'heures effectuées */
  totalHeuresEffectuees: number;
  /** Nombre total d'heures prévues au programme */
  totalHeuresPrevues?: number;
}

// ------------------------------------------------------------
// OPTIONS D'EXPORT
// ------------------------------------------------------------

/** Options communes à tous les exports PDF */
export interface OptionsPDF {
  /** Ouvrir le PDF après génération */
  ouvrirApresGeneration?: boolean;
  /** Chemin de sauvegarde (si non défini, dialog de sauvegarde) */
  cheminSauvegarde?: string;
  /** Inclure le logo de l'établissement */
  inclureLogo?: boolean;
  /** Format de page */
  format?: 'A4' | 'A5' | 'Letter';
  /** Orientation */
  orientation?: 'portrait' | 'landscape';
}

// ------------------------------------------------------------
// RÉSULTATS D'EXPORT
// ------------------------------------------------------------

/** Résultat d'une opération d'export PDF */
export interface ResultatExport {
  succes: boolean;
  /** Chemin du fichier généré */
  cheminFichier?: string;
  /** Message d'erreur en cas d'échec */
  erreur?: string;
  /** Nombre de pages générées */
  nombrePages?: number;
}
