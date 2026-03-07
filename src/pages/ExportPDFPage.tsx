// ============================================================
// PedaClic Pro Desktop — Page Export PDF
// Interface pour générer bulletins, listes et cahier de textes
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import './ExportPDF.css';
import {
  genererBulletin,
  genererListeClasse,
  genererCahierTextes,
  previsualiserBulletin,
  previsualiserListeClasse,
  previsualiserCahierTextes,
} from '../services/pdfService';
import type {
  DonneesBulletin,
  DonneesListeClasse,
  DonneesCahierTextes,
  NoteMatiere,
} from '../types/pdfTypes';
import { getClasses } from '../db/classesService';
import { getElevesParClasse } from '../db/elevesService';
import { getBulletinClasse, type BulletinEleve } from '../db/notesService';
import { getStatsAbsencesEleve } from '../db/absencesService';
import { useAuth } from '../contexts/AuthContext';
import type { Classe, Eleve } from '../types';

// ------------------------------------------------------------
// TYPES LOCAUX
// ------------------------------------------------------------
type OngletExport = 'bulletin' | 'liste' | 'cahier';
type EtatGeneration = 'idle' | 'generation' | 'succes' | 'erreur';

interface FeedbackExport {
  etat:     EtatGeneration;
  message?: string;
  chemin?:  string;
}

// ------------------------------------------------------------
// HELPER — Construire DonneesBulletin depuis BulletinEleve + SQLite
// ------------------------------------------------------------
function buildDonneesBulletin(
  bulletin: BulletinEleve,
  bulletinsClasse: BulletinEleve[],
  classe: Classe,
  eleve: Eleve,
  trimestre: 1 | 2 | 3,
  etablissement: { nom: string; adresse?: string; ville?: string; anneeScolaire: string },
  absencesTotalHeures: number,
  absencesNonJustifiees: number,
): DonneesBulletin {
  const notes: NoteMatiere[] = Object.entries(bulletin.moyennes_matieres).map(([matiere, note]) => {
    const moyennesMatiere = bulletinsClasse
      .map(b => b.moyennes_matieres[matiere])
      .filter((v): v is number => v !== null && v !== undefined);
    const moyenneClasse = moyennesMatiere.length > 0
      ? Math.round(moyennesMatiere.reduce((a, b) => a + b, 0) / moyennesMatiere.length * 100) / 100
      : undefined;
    const rangs = bulletinsClasse
      .filter(b => b.moyennes_matieres[matiere] != null)
      .sort((a, b) => (b.moyennes_matieres[matiere] ?? -1) - (a.moyennes_matieres[matiere] ?? -1));
    const rang = rangs.findIndex(b => b.eleve_id === eleve.id) + 1 || undefined;
    return {
      matiere,
      coefficient: 1,
      note: note,
      moyenneClasse,
      rang: rang || undefined,
      appreciation: '',
    };
  });
  const effectifClasse = bulletinsClasse.length;
  const moyenneClasse = effectifClasse > 0
    ? bulletinsClasse
        .map(b => b.moyenne_generale)
        .filter((v): v is number => v != null)
        .reduce((a, b) => a + b, 0) / effectifClasse
    : 0;
  const mention =
    (bulletin.moyenne_generale ?? 0) >= 16 ? 'Très Bien' :
    (bulletin.moyenne_generale ?? 0) >= 14 ? 'Bien' :
    (bulletin.moyenne_generale ?? 0) >= 12 ? 'Assez Bien' :
    (bulletin.moyenne_generale ?? 0) >= 10 ? 'Passable' : 'Insuffisant';
  const dateNaiss = eleve.date_naissance
    ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : undefined;
  return {
    etablissement: {
      nom: etablissement.nom,
      adresse: etablissement.adresse || '',
      ville: etablissement.ville || '',
      anneeScolaire: etablissement.anneeScolaire || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    },
    trimestre,
    eleve: {
      nom: eleve.nom,
      prenom: eleve.prenom,
      matricule: eleve.matricule,
      classe: classe.nom,
      dateNaissance: dateNaiss,
    },
    notes,
    resultats: {
      moyenneGenerale: bulletin.moyenne_generale ?? 0,
      rangClasse: bulletin.rang,
      effectifClasse,
      moyenneClasse: Math.round(moyenneClasse * 100) / 100,
      mention,
    },
    absences: { totalHeures: absencesTotalHeures, nonJustifiees: absencesNonJustifiees },
    decision: (bulletin.moyenne_generale ?? 0) >= 10 ? 'Admis(e) en classe supérieure' : 'À préciser par le conseil',
    dateEdition: new Date().toLocaleDateString('fr-SN'),
  };
}

// ------------------------------------------------------------
// DONNÉES DE TEST — Utilisées si aucune donnée SQLite disponible
// ------------------------------------------------------------

// Exemple : données bulletin pour un élève sénégalais
const DONNEES_BULLETIN_EXEMPLE: DonneesBulletin = {
  etablissement: {
    nom:          'Lycée Blaise Diagne',
    adresse:      'Rue 5, Médina',
    ville:        'Dakar',
    telephone:    '33 823 00 00',
    anneeScolaire: '2024-2025',
  },
  trimestre: 1,
  eleve: {
    nom:            'DIALLO',
    prenom:         'Mamadou',
    matricule:      'SN-2024-0042',
    classe:         'Terminale S2',
    dateNaissance:  '15/03/2006',
    lieuNaissance:  'Dakar',
  },
  notes: [
    { matiere: 'Mathématiques',         coefficient: 5, note: 14.5,  moyenneClasse: 11.2, rang: 3,  appreciation: 'Bon travail, continuez.' },
    { matiere: 'Physique-Chimie',        coefficient: 4, note: 12.0,  moyenneClasse: 10.8, rang: 5,  appreciation: 'Résultats satisfaisants.' },
    { matiere: 'SVT',                    coefficient: 3, note: 15.5,  moyenneClasse: 12.0, rang: 1,  appreciation: 'Excellent trimestre.' },
    { matiere: 'Français',               coefficient: 3, note: 11.0,  moyenneClasse: 10.5, rang: 8,  appreciation: 'Peut mieux faire.' },
    { matiere: 'Anglais',                coefficient: 2, note: 13.0,  moyenneClasse: 11.0, rang: 4,  appreciation: 'Bon niveau oral.' },
    { matiere: 'Histoire-Géographie',    coefficient: 2, note: 10.5,  moyenneClasse: 10.2, rang: 10, appreciation: '' },
    { matiere: 'Philosophie',            coefficient: 2, note: 9.0,   moyenneClasse: 9.5,  rang: 14, appreciation: 'Des efforts à fournir.' },
    { matiere: 'EPS',                    coefficient: 1, note: 16.0,  moyenneClasse: 13.5, rang: 2,  appreciation: 'Excellent.' },
  ],
  resultats: {
    moyenneGenerale:  12.85,
    rangClasse:       5,
    effectifClasse:   42,
    moyenneClasse:    11.20,
    mention:          'Assez Bien',
    appreciationConseil: 'Élève sérieux et travailleur. Les résultats sont globalement satisfaisants. Des progrès sont attendus en Philosophie et en Français pour les prochains trimestres.',
  },
  absences: {
    totalHeures:     6,
    nonJustifiees:   2,
  },
  decision:    'Admis(e) en classe supérieure',
  dateEdition: new Date().toLocaleDateString('fr-SN'),
};

// ------------------------------------------------------------
// COMPOSANT — Onglet sélecteur
// ------------------------------------------------------------
interface OngletButtonProps {
  actif:   boolean;
  icone:   string;
  label:   string;
  onClick: () => void;
}

const OngletButton: React.FC<OngletButtonProps> = ({ actif, icone, label, onClick }) => (
  <button
    className={`export-pdf__onglet ${actif ? 'export-pdf__onglet--actif' : ''}`}
    onClick={onClick}
  >
    <span className="export-pdf__onglet-icone">{icone}</span>
    <span className="export-pdf__onglet-label">{label}</span>
  </button>
);

// ------------------------------------------------------------
// COMPOSANT — Feedback de génération
// ------------------------------------------------------------
interface FeedbackProps {
  feedback: FeedbackExport;
  onReset:  () => void;
}

const FeedbackBanner: React.FC<FeedbackProps> = ({ feedback, onReset }) => {
  if (feedback.etat === 'idle') return null;

  const config = {
    generation: { classe: 'loading', icone: '⏳', texte: 'Génération en cours…' },
    succes:     { classe: 'succes',  icone: '✅', texte: feedback.message || 'PDF généré avec succès !' },
    erreur:     { classe: 'erreur',  icone: '❌', texte: feedback.message || 'Erreur lors de la génération.' },
  }[feedback.etat];

  return (
    <div className={`export-pdf__feedback export-pdf__feedback--${config.classe}`}>
      <span className="export-pdf__feedback-icone">{config.icone}</span>
      <span className="export-pdf__feedback-texte">{config.texte}</span>
      {feedback.chemin && (
        <span className="export-pdf__feedback-chemin">📁 {feedback.chemin}</span>
      )}
      {feedback.etat !== 'generation' && (
        <button className="export-pdf__feedback-close" onClick={onReset}>✕</button>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// COMPOSANT — Section Bulletin
// ------------------------------------------------------------
interface SectionBulletinProps {
  onFeedback: (f: FeedbackExport) => void;
}

const SectionBulletin: React.FC<SectionBulletinProps> = ({ onFeedback }) => {
  const { utilisateur } = useAuth();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [trimestre, setTrimestre] = useState<1|2|3>(1);
  const [classeSelectee, setClasseSelectee] = useState('');
  const [eleveSelecte, setEleveSelecte] = useState('');
  const [donneesEleve, setDonneesEleve] = useState<DonneesBulletin | null>(null);
  const [loadingBulletin, setLoadingBulletin] = useState(false);
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

  useEffect(() => {
    getClasses().then(setClasses).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!classeSelectee) {
      setEleves([]);
      setEleveSelecte('');
      setDonneesEleve(null);
      return;
    }
    const classeId = parseInt(classeSelectee, 10);
    if (isNaN(classeId)) return;
    getElevesParClasse(classeId).then(setEleves).catch(() => setEleves([]));
    setEleveSelecte('');
    setDonneesEleve(null);
  }, [classeSelectee]);

  useEffect(() => {
    if (!eleveSelecte || !classeSelectee) {
      setDonneesEleve(null);
      return;
    }
    const classeId = parseInt(classeSelectee, 10);
    const eleveId = parseInt(eleveSelecte, 10);
    if (isNaN(classeId) || isNaN(eleveId)) return;

    setLoadingBulletin(true);
    Promise.all([
      getBulletinClasse(classeId, trimestre),
      getStatsAbsencesEleve(eleveId, trimestre),
    ])
      .then(([bulletins, absStats]) => {
        const bulletin = bulletins.find(b => b.eleve_id === eleveId);
        const eleve = eleves.find(e => e.id === eleveId);
        const classe = classes.find(c => c.id === classeId);
        if (!bulletin || !eleve || !classe) {
          setDonneesEleve(null);
          return;
        }
        const annee = new Date().getFullYear();
        const anneeScolaire = `${annee}-${annee + 1}`;
        const nonJustifieesHeures = absStats.total > 0
          ? Math.round(absStats.heures_total * (absStats.non_justifiees / absStats.total) * 10) / 10
          : 0;
        const d = buildDonneesBulletin(
          bulletin,
          bulletins,
          classe,
          eleve,
          trimestre,
          {
            nom: utilisateur?.etablissement || 'Établissement',
            anneeScolaire,
          },
          absStats.heures_total,
          nonJustifieesHeures,
        );
        setDonneesEleve(d);
      })
      .catch(() => setDonneesEleve(null))
      .finally(() => setLoadingBulletin(false));
  }, [eleveSelecte, classeSelectee, trimestre, eleves, classes, utilisateur]);

  const donnees = donneesEleve ?? DONNEES_BULLETIN_EXEMPLE;

  const handlePrevisualiser = async () => {
    onFeedback({ etat: 'generation' });
    const url = await previsualiserBulletin(donnees);
    if (url) {
      setUrlPreview(url);
      onFeedback({ etat: 'idle' });
    } else {
      onFeedback({ etat: 'erreur', message: 'Impossible de générer la prévisualisation.' });
    }
  };

  const handleExporter = async () => {
    onFeedback({ etat: 'generation' });
    const resultat = await genererBulletin(donnees);
    if (resultat.succes) {
      onFeedback({
        etat: 'succes',
        message: 'Bulletin généré avec succès !',
        chemin: resultat.cheminFichier,
      });
    } else {
      onFeedback({ etat: 'erreur', message: resultat.erreur });
    }
  };

  return (
    <div className="export-pdf__section">
      <div className="export-pdf__section-header">
        <h2 className="export-pdf__section-titre">📋 Bulletin de Notes</h2>
        <p className="export-pdf__section-desc">
          Générez les bulletins trimestriels individuels pour chaque élève.
        </p>
      </div>

      {/* Formulaire de sélection */}
      <div className="export-pdf__form">
        <div className="export-pdf__form-row">
          {/* Trimestre */}
          <div className="export-pdf__form-group">
            <label className="export-pdf__label">Trimestre</label>
            <div className="export-pdf__btn-group">
              {([1, 2, 3] as const).map(t => (
                <button
                  key={t}
                  className={`export-pdf__btn-trimestre ${trimestre === t ? 'export-pdf__btn-trimestre--actif' : ''}`}
                  onClick={() => setTrimestre(t)}
                >
                  T{t}
                </button>
              ))}
            </div>
          </div>

          {/* Classe */}
          <div className="export-pdf__form-group">
            <label className="export-pdf__label" htmlFor="select-classe-bulletin">
              Classe
            </label>
            <select
              id="select-classe-bulletin"
              className="export-pdf__select"
              value={classeSelectee}
              onChange={e => setClasseSelectee(e.target.value)}
            >
              <option value="">— Sélectionner une classe —</option>
              {classes.map(c => (
                <option key={c.id} value={String(c.id)}>{c.nom}</option>
              ))}
            </select>
          </div>

          {/* Élève */}
          <div className="export-pdf__form-group">
            <label className="export-pdf__label" htmlFor="select-eleve">
              Élève
            </label>
            <select
              id="select-eleve"
              className="export-pdf__select"
              value={eleveSelecte}
              onChange={e => setEleveSelecte(e.target.value)}
              disabled={!classeSelectee}
            >
              <option value="">— Sélectionner un élève —</option>
              {eleves.map(e => (
                <option key={e.id} value={String(e.id)}>
                  {e.nom} {e.prenom}{e.matricule ? ` (${e.matricule})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        {loadingBulletin && eleveSelecte && (
          <p className="export-pdf__loading">Chargement des notes…</p>
        )}
        <div className="export-pdf__actions">
          <button
            className="export-pdf__btn export-pdf__btn--secondaire"
            onClick={handlePrevisualiser}
            disabled={loadingBulletin}
          >
            👁 Prévisualiser
          </button>
          <button
            className="export-pdf__btn export-pdf__btn--primaire"
            onClick={handleExporter}
            disabled={loadingBulletin}
          >
            ⬇ Exporter PDF
          </button>
          <button
            className="export-pdf__btn export-pdf__btn--lot"
            onClick={handleExporter}
            title="Génère un PDF pour chaque élève de la classe (utilise les données de l'élève sélectionné pour l'instant)"
          >
            📦 Exporter toute la classe
          </button>
        </div>
      </div>

      {/* Prévisualisation */}
      {urlPreview && (
        <div className="export-pdf__preview">
          <div className="export-pdf__preview-header">
            <span>Prévisualisation</span>
            <button
              className="export-pdf__preview-close"
              onClick={() => setUrlPreview(null)}
            >
              ✕
            </button>
          </div>
          <iframe
            src={urlPreview}
            className="export-pdf__preview-iframe"
            title="Prévisualisation bulletin"
          />
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// COMPOSANT — Section Liste de Classe
// ------------------------------------------------------------
interface SectionListeProps {
  onFeedback: (f: FeedbackExport) => void;
}

const SectionListeClasse: React.FC<SectionListeProps> = ({ onFeedback }) => {
  const [typeDoc,  setTypeDoc]  = useState<'appel' | 'composition'>('appel');
  const [classe,   setClasse]   = useState('');
  const [matiere,  setMatiere]  = useState('');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

  const classes  = ['6ème A', '5ème B', '4ème A', '3ème C', 'Seconde A', 'Terminale S2'];
  const matieres = ['Mathématiques', 'Français', 'Physique-Chimie', 'SVT', 'Anglais', 'Histoire-Géo'];

  // Données exemple liste classe
  const donneesExemple: DonneesListeClasse = {
    etablissement: {
      nom: 'Lycée Blaise Diagne', adresse: 'Rue 5, Médina',
      ville: 'Dakar', anneeScolaire: '2024-2025',
    },
    classe: classe || 'Terminale S2',
    professeurPrincipal: 'M. Samba NDIAYE',
    matiere: matiere || undefined,
    typeDocument: typeDoc,
    trimestre: 1,
    date: new Date().toLocaleDateString('fr-SN'),
    eleves: [
      { numero: 1, matricule: 'SN-001', nom: 'DIALLO',   prenom: 'Mamadou',  sexe: 'M', dateNaissance: '15/03/2006' },
      { numero: 2, matricule: 'SN-002', nom: 'FALL',     prenom: 'Fatou',    sexe: 'F', dateNaissance: '22/07/2006' },
      { numero: 3, matricule: 'SN-003', nom: 'NDIAYE',   prenom: 'Ibrahima', sexe: 'M', dateNaissance: '10/01/2006', redoublant: true },
      { numero: 4, matricule: 'SN-004', nom: 'SOW',      prenom: 'Aïssatou', sexe: 'F', dateNaissance: '05/09/2006' },
      { numero: 5, matricule: 'SN-005', nom: 'SARR',     prenom: 'Moussa',   sexe: 'M', dateNaissance: '18/11/2005' },
      { numero: 6, matricule: 'SN-006', nom: 'FAYE',     prenom: 'Mariama',  sexe: 'F', dateNaissance: '30/04/2006' },
    ],
  };

  const handlePrevisualiser = async () => {
    onFeedback({ etat: 'generation' });
    const url = await previsualiserListeClasse(donneesExemple);
    if (url) { setUrlPreview(url); onFeedback({ etat: 'idle' }); }
    else { onFeedback({ etat: 'erreur', message: 'Erreur prévisualisation.' }); }
  };

  const handleExporter = async () => {
    onFeedback({ etat: 'generation' });
    const resultat = await genererListeClasse(donneesExemple);
    if (resultat.succes) {
      onFeedback({ etat: 'succes', message: 'Liste générée !', chemin: resultat.cheminFichier });
    } else {
      onFeedback({ etat: 'erreur', message: resultat.erreur });
    }
  };

  return (
    <div className="export-pdf__section">
      <div className="export-pdf__section-header">
        <h2 className="export-pdf__section-titre">📑 Liste de Classe</h2>
        <p className="export-pdf__section-desc">
          Générez des listes d'appel ou des feuilles de composition.
        </p>
      </div>

      <div className="export-pdf__form">
        {/* Type de document */}
        <div className="export-pdf__form-group">
          <label className="export-pdf__label">Type de document</label>
          <div className="export-pdf__type-cards">
            <button
              className={`export-pdf__type-card ${typeDoc === 'appel' ? 'export-pdf__type-card--actif' : ''}`}
              onClick={() => setTypeDoc('appel')}
            >
              <span className="export-pdf__type-card-icone">📋</span>
              <span className="export-pdf__type-card-nom">Liste d'appel</span>
              <span className="export-pdf__type-card-desc">Cases à cocher journalières</span>
            </button>
            <button
              className={`export-pdf__type-card ${typeDoc === 'composition' ? 'export-pdf__type-card--actif' : ''}`}
              onClick={() => setTypeDoc('composition')}
            >
              <span className="export-pdf__type-card-icone">✏️</span>
              <span className="export-pdf__type-card-nom">Feuille de composition</span>
              <span className="export-pdf__type-card-desc">Colonnes de notes + rang</span>
            </button>
          </div>
        </div>

        <div className="export-pdf__form-row">
          <div className="export-pdf__form-group">
            <label className="export-pdf__label" htmlFor="select-classe-liste">Classe</label>
            <select
              id="select-classe-liste"
              className="export-pdf__select"
              value={classe}
              onChange={e => setClasse(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {typeDoc === 'composition' && (
            <div className="export-pdf__form-group">
              <label className="export-pdf__label" htmlFor="select-matiere-liste">Matière</label>
              <select
                id="select-matiere-liste"
                className="export-pdf__select"
                value={matiere}
                onChange={e => setMatiere(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {matieres.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="export-pdf__actions">
          <button className="export-pdf__btn export-pdf__btn--secondaire" onClick={handlePrevisualiser}>
            👁 Prévisualiser
          </button>
          <button className="export-pdf__btn export-pdf__btn--primaire" onClick={handleExporter}>
            ⬇ Exporter PDF
          </button>
        </div>
      </div>

      {urlPreview && (
        <div className="export-pdf__preview">
          <div className="export-pdf__preview-header">
            <span>Prévisualisation</span>
            <button className="export-pdf__preview-close" onClick={() => setUrlPreview(null)}>✕</button>
          </div>
          <iframe src={urlPreview} className="export-pdf__preview-iframe" title="Prévisualisation liste" />
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// COMPOSANT — Section Cahier de Textes
// ------------------------------------------------------------
interface SectionCahierProps {
  onFeedback: (f: FeedbackExport) => void;
}

const SectionCahierTextes: React.FC<SectionCahierProps> = ({ onFeedback }) => {
  const [classe,   setClasse]   = useState('');
  const [matiere,  setMatiere]  = useState('');
  const [periode,  setPeriode]  = useState('1er Trimestre');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

  const donneesExemple: DonneesCahierTextes = {
    etablissement: { nom: 'Lycée Blaise Diagne', adresse: 'Rue 5, Médina', ville: 'Dakar', anneeScolaire: '2024-2025' },
    matiere:  matiere || 'Mathématiques',
    classe:   classe  || 'Terminale S2',
    nomProf:  'M. Samba NDIAYE',
    anneeScolaire: '2024-2025',
    periode:  periode,
    totalHeuresEffectuees: 28,
    totalHeuresPrevues:    36,
    seances: [
      { date: '02/10/2024', horaire: '08h-10h', duree: 2, titre: 'Les suites numériques',
        contenu: 'Introduction aux suites arithmétiques et géométriques. Définitions et propriétés fondamentales. Exemples concrets avec des progressions de revenus.',
        travailFaire: 'Exercices 1 à 5 page 47 du manuel', observations: 'Bonne participation générale.' },
      { date: '09/10/2024', horaire: '08h-10h', duree: 2, titre: 'Suites arithmétiques — Approfondissement',
        contenu: 'Somme des termes d\'une suite arithmétique. Formule générale. Applications : calcul de salaires, remboursements d\'emprunts.',
        travailFaire: 'Problème de la page 52 (emprunt immobilier)', observations: '' },
      { date: '16/10/2024', horaire: '08h-10h', duree: 2, titre: 'Suites géométriques',
        contenu: 'Propriétés des suites géométriques. Raison. Applications en biologie (croissance bactérienne) et en finance (intérêts composés).',
        travailFaire: 'Réviser les 2 premières séances pour le devoir.' },
    ],
  };

  const handlePrevisualiser = async () => {
    onFeedback({ etat: 'generation' });
    const url = await previsualiserCahierTextes(donneesExemple);
    if (url) { setUrlPreview(url); onFeedback({ etat: 'idle' }); }
    else { onFeedback({ etat: 'erreur', message: 'Erreur prévisualisation.' }); }
  };

  const handleExporter = async () => {
    onFeedback({ etat: 'generation' });
    const resultat = await genererCahierTextes(donneesExemple);
    if (resultat.succes) {
      onFeedback({ etat: 'succes', message: 'Cahier exporté !', chemin: resultat.cheminFichier });
    } else {
      onFeedback({ etat: 'erreur', message: resultat.erreur });
    }
  };

  const periodes = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre', 'Année complète'];

  return (
    <div className="export-pdf__section">
      <div className="export-pdf__section-header">
        <h2 className="export-pdf__section-titre">📓 Cahier de Textes</h2>
        <p className="export-pdf__section-desc">
          Exportez votre cahier de textes pour l'inspection pédagogique.
        </p>
      </div>

      <div className="export-pdf__form">
        <div className="export-pdf__form-row">
          <div className="export-pdf__form-group">
            <label className="export-pdf__label">Classe</label>
            <select className="export-pdf__select" value={classe} onChange={e => setClasse(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {['6ème A', '5ème B', 'Terminale S2'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="export-pdf__form-group">
            <label className="export-pdf__label">Matière</label>
            <select className="export-pdf__select" value={matiere} onChange={e => setMatiere(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {['Mathématiques', 'Français', 'SVT', 'Physique-Chimie'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="export-pdf__form-group">
            <label className="export-pdf__label">Période</label>
            <select className="export-pdf__select" value={periode} onChange={e => setPeriode(e.target.value)}>
              {periodes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="export-pdf__actions">
          <button className="export-pdf__btn export-pdf__btn--secondaire" onClick={handlePrevisualiser}>
            👁 Prévisualiser
          </button>
          <button className="export-pdf__btn export-pdf__btn--primaire" onClick={handleExporter}>
            ⬇ Exporter PDF
          </button>
        </div>
      </div>

      {urlPreview && (
        <div className="export-pdf__preview">
          <div className="export-pdf__preview-header">
            <span>Prévisualisation</span>
            <button className="export-pdf__preview-close" onClick={() => setUrlPreview(null)}>✕</button>
          </div>
          <iframe src={urlPreview} className="export-pdf__preview-iframe" title="Prévisualisation cahier" />
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// PAGE PRINCIPALE — Export PDF
// ------------------------------------------------------------
const ExportPDFPage: React.FC = () => {
  const [ongletActif, setOngletActif] = useState<OngletExport>('bulletin');
  const [feedback,    setFeedback]    = useState<FeedbackExport>({ etat: 'idle' });

  const handleFeedback = useCallback((f: FeedbackExport) => {
    setFeedback(f);
    // Auto-reset succès après 5 secondes
    if (f.etat === 'succes') {
      setTimeout(() => setFeedback({ etat: 'idle' }), 5000);
    }
  }, []);

  return (
    <div className="export-pdf">
      {/* ── EN-TÊTE PAGE ────────────────────────────────── */}
      <div className="export-pdf__header">
        <div className="export-pdf__header-titre">
          <h1 className="export-pdf__titre">Export PDF</h1>
          <p className="export-pdf__sous-titre">
            Bulletins · Listes de classe · Cahier de textes
          </p>
        </div>
        <div className="export-pdf__header-badge">
          <span className="export-pdf__badge">📄 Impression prête</span>
        </div>
      </div>

      {/* ── FEEDBACK ────────────────────────────────────── */}
      <FeedbackBanner
        feedback={feedback}
        onReset={() => setFeedback({ etat: 'idle' })}
      />

      {/* ── ONGLETS ─────────────────────────────────────── */}
      <div className="export-pdf__onglets">
        <OngletButton
          actif={ongletActif === 'bulletin'}
          icone="📋"
          label="Bulletins"
          onClick={() => setOngletActif('bulletin')}
        />
        <OngletButton
          actif={ongletActif === 'liste'}
          icone="📑"
          label="Listes de classe"
          onClick={() => setOngletActif('liste')}
        />
        <OngletButton
          actif={ongletActif === 'cahier'}
          icone="📓"
          label="Cahier de textes"
          onClick={() => setOngletActif('cahier')}
        />
      </div>

      {/* ── CONTENU DE L'ONGLET ─────────────────────────── */}
      <div className="export-pdf__contenu">
        {ongletActif === 'bulletin' && <SectionBulletin  onFeedback={handleFeedback} />}
        {ongletActif === 'liste'    && <SectionListeClasse onFeedback={handleFeedback} />}
        {ongletActif === 'cahier'   && <SectionCahierTextes onFeedback={handleFeedback} />}
      </div>
    </div>
  );
};

export default ExportPDFPage;
