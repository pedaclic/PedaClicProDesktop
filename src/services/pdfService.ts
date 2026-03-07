// ============================================================
// PedaClic Pro Desktop — PDF Service
// Génération et sauvegarde des PDFs via Electron + @react-pdf/renderer
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================
// Utilise :
//   - @react-pdf/renderer (rendu PDF côté renderer process)
//   - Electron IPC pour la sélection du chemin de sauvegarde
//   - electron.shell.openPath() pour ouvrir après génération
// ============================================================

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import BulletinPDF from '../pdf/BulletinPDF';
import ListeClassePDF from '../pdf/ListeClassePDF';
import CahierTextesPDF from '../pdf/CahierTextesPDF';
import type {
  DonneesBulletin,
  DonneesListeClasse,
  DonneesCahierTextes,
  OptionsPDF,
  ResultatExport,
} from '../types/pdfTypes';

// ------------------------------------------------------------
// TYPE — Electron IPC exposé via preload (electronAPI)
// ------------------------------------------------------------

// ------------------------------------------------------------
// HELPER — Convertir un ReactElement @react-pdf en ArrayBuffer
// ------------------------------------------------------------
async function reactPdfToBuffer(element: React.ReactElement): Promise<ArrayBuffer> {
  const pdfInstance = pdf(element);
  const blob = await pdfInstance.toBlob();
  return await blob.arrayBuffer();
}

// ------------------------------------------------------------
// HELPER — Nom de fichier par défaut
// Formaté : pedaclic_type_classe_date.pdf
// ------------------------------------------------------------
function nomFichierDefaut(type: string, identifiant: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const clean = identifiant.replace(/[^a-zA-Z0-9_\-À-ÿ]/g, '_');
  return `pedaclic_${type}_${clean}_${date}.pdf`;
}

// ------------------------------------------------------------
// HELPER — Sauvegarder un PDF via Electron IPC
// Ouvre la dialog "Enregistrer sous" si pas de chemin fourni
// ------------------------------------------------------------
async function sauvegarderPDF(
  buffer:       ArrayBuffer,
  nomDefaut:    string,
  options:      OptionsPDF,
): Promise<ResultatExport> {
  try {
    if (typeof window.electronAPI?.pdfSavePath !== 'function' ||
        typeof window.electronAPI?.pdfWrite !== 'function') {
      return { succes: false, erreur: 'Export PDF non disponible (ouvrez via Electron)' };
    }
    // Chemin direct ou dialog Electron
    let cheminFinal = options.cheminSauvegarde ?? null;

    if (!cheminFinal) {
      cheminFinal = await window.electronAPI.pdfSavePath(nomDefaut);
    }

    // L'utilisateur a annulé la dialog
    if (!cheminFinal) {
      return { succes: false, erreur: 'Annulé par l\'utilisateur' };
    }

    // Écrire le fichier via IPC
    await window.electronAPI.pdfWrite(cheminFinal, buffer);

    // Ouvrir le fichier si demandé
    if (options.ouvrirApresGeneration !== false && window.electronAPI.pdfOpenFile) {
      await window.electronAPI.pdfOpenFile(cheminFinal);
    }

    return { succes: true, cheminFichier: cheminFinal };

  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
    console.error('[PDFService] Erreur sauvegarde :', message);
    return { succes: false, erreur: message };
  }
}

// ------------------------------------------------------------
// API PUBLIQUE — Génération bulletin scolaire
// Un PDF par élève, format A4 portrait
// ------------------------------------------------------------
export async function genererBulletin(
  donnees:  DonneesBulletin,
  options:  OptionsPDF = {},
): Promise<ResultatExport> {
  try {
    const nomFichier = nomFichierDefaut(
      'bulletin',
      `${donnees.eleve.nom}_${donnees.eleve.prenom}_T${donnees.trimestre}`
    );

    const element = React.createElement(BulletinPDF, { donnees });
    const buffer  = await reactPdfToBuffer(element);

    return await sauvegarderPDF(buffer, nomFichier, options);

  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur génération bulletin';
    return { succes: false, erreur: message };
  }
}

// ------------------------------------------------------------
// API PUBLIQUE — Génération bulletins en lot (toute la classe)
// Génère un PDF par élève
// ⚠ Opération longue — afficher une barre de progression
// ------------------------------------------------------------
export async function genererBulletinsLot(
  bulletins:     DonneesBulletin[],
  dossierCible:  string,
  onProgression: (actuel: number, total: number, nomEleve: string) => void,
): Promise<{ succes: number; echecs: number; erreurs: string[] }> {
  let succes  = 0;
  let echecs  = 0;
  const erreurs: string[] = [];

  for (let i = 0; i < bulletins.length; i++) {
    const donnees = bulletins[i];
    const nomEleve = `${donnees.eleve.nom} ${donnees.eleve.prenom}`;

    onProgression(i + 1, bulletins.length, nomEleve);

    const resultat = await genererBulletin(donnees, {
      cheminSauvegarde: `${dossierCible}/bulletin_${nomEleve.replace(/ /g, '_')}_T${donnees.trimestre}.pdf`,
      ouvrirApresGeneration: false,
    });

    if (resultat.succes) {
      succes++;
    } else {
      echecs++;
      erreurs.push(`${nomEleve}: ${resultat.erreur}`);
    }
  }

  return { succes, echecs, erreurs };
}

// ------------------------------------------------------------
// API PUBLIQUE — Génération liste de classe
// ------------------------------------------------------------
export async function genererListeClasse(
  donnees:  DonneesListeClasse,
  options:  OptionsPDF = {},
): Promise<ResultatExport> {
  try {
    const typeDoc = donnees.typeDocument === 'composition'
      ? 'composition'
      : 'appel';

    const nomFichier = nomFichierDefaut(
      `liste_${typeDoc}`,
      donnees.classe
    );

    const element = React.createElement(ListeClassePDF, { donnees });
    const buffer  = await reactPdfToBuffer(element);

    return await sauvegarderPDF(buffer, nomFichier, options);

  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur génération liste';
    return { succes: false, erreur: message };
  }
}

// ------------------------------------------------------------
// API PUBLIQUE — Génération cahier de textes
// ------------------------------------------------------------
export async function genererCahierTextes(
  donnees:  DonneesCahierTextes,
  options:  OptionsPDF = {},
): Promise<ResultatExport> {
  try {
    const nomFichier = nomFichierDefaut(
      'cahier_textes',
      `${donnees.matiere}_${donnees.classe}`
    );

    const element = React.createElement(CahierTextesPDF, { donnees });
    const buffer  = await reactPdfToBuffer(element);

    return await sauvegarderPDF(buffer, nomFichier, options);

  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur génération cahier';
    return { succes: false, erreur: message };
  }
}

// ------------------------------------------------------------
// API PUBLIQUE — Prévisualisation dans le navigateur intégré
// Génère une URL Blob pour afficher dans un <iframe>
// ------------------------------------------------------------
export async function previsualiserBulletin(
  donnees: DonneesBulletin,
): Promise<string | null> {
  try {
    const element      = React.createElement(BulletinPDF, { donnees });
    const pdfInstance  = pdf(element);
    const blob         = await pdfInstance.toBlob();
    return URL.createObjectURL(blob);
  } catch (erreur) {
    console.error('[PDFService] Erreur prévisualisation :', erreur);
    return null;
  }
}

export async function previsualiserListeClasse(
  donnees: DonneesListeClasse,
): Promise<string | null> {
  try {
    const element      = React.createElement(ListeClassePDF, { donnees });
    const pdfInstance  = pdf(element);
    const blob         = await pdfInstance.toBlob();
    return URL.createObjectURL(blob);
  } catch (erreur) {
    console.error('[PDFService] Erreur prévisualisation liste :', erreur);
    return null;
  }
}

export async function previsualiserCahierTextes(
  donnees: DonneesCahierTextes,
): Promise<string | null> {
  try {
    const element      = React.createElement(CahierTextesPDF, { donnees });
    const pdfInstance  = pdf(element);
    const blob         = await pdfInstance.toBlob();
    return URL.createObjectURL(blob);
  } catch (erreur) {
    console.error('[PDFService] Erreur prévisualisation cahier :', erreur);
    return null;
  }
}
