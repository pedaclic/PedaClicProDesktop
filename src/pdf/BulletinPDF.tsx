// ============================================================
// PedaClic Pro Desktop — Bulletin Scolaire PDF
// Template React PDF pour bulletins trimestriels sénégalais
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================
// Librairie : @react-pdf/renderer
// Installation : npm install @react-pdf/renderer
// ============================================================

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { DonneesBulletin, NoteMatiere } from '../types/pdfTypes';

import logoEtablissement from '../assets/logo-etablissement.png';
import robotoRegular from '../assets/fonts/Roboto-Regular.ttf';
import robotoBold from '../assets/fonts/Roboto-Bold.ttf';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: robotoRegular, fontWeight: 400 },
    { src: robotoBold, fontWeight: 700 },
  ],
});

// ------------------------------------------------------------
// PALETTE DE COULEURS — Design system PedaClic
// Bleu professionnel adapté à l'impression
// ------------------------------------------------------------
const COLORS = {
  bleuPrimaire: '#1e3a8a',     // En-tête principal
  bleuMoyen:    '#2563eb',     // Sous-en-têtes
  bleuClair:    '#dbeafe',     // Fond lignes alternées
  vertSucces:   '#16a34a',     // Mention positive
  orMoyen:      '#d97706',     // Mention passable
  rougeDanger:  '#dc2626',     // Alerte / danger
  grisTexte:    '#374151',     // Texte principal
  grisLegende:  '#6b7280',     // Labels secondaires
  grisClair:    '#f9fafb',     // Fond alterné clair
  blanc:        '#ffffff',
  bordure:      '#d1d5db',
};

// ------------------------------------------------------------
// STYLES @react-pdf/renderer
// Note : pas de CSS classique — StyleSheet.create uniquement
// ------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────
  page: {
    fontFamily:      'Roboto',
    fontSize:        9,
    color:           COLORS.grisTexte,
    padding:         24,
    backgroundColor: COLORS.blanc,
  },

  // ── En-tête établissement ─────────────────────────────────
  headerContainer: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    marginBottom:    10,
    paddingBottom:   8,
    borderBottom:    `2pt solid ${COLORS.bleuPrimaire}`,
  },
  logoEtablissement: {
    width:  50,
    height: 50,
    marginRight: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex:        1,
    alignItems:  'flex-end',
  },
  etatRepublique: {
    fontSize:   7,
    color:      COLORS.grisLegende,
    marginBottom: 2,
  },
  nomEtablissement: {
    fontSize:    12,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
    marginBottom: 2,
  },
  adresseEtablissement: {
    fontSize:  7.5,
    color:     COLORS.grisLegende,
    lineHeight: 1.4,
  },
  titreBulletin: {
    fontSize:    14,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sousTitreBulletin: {
    fontSize: 9,
    color:    COLORS.bleuMoyen,
  },

  // ── Infos élève ───────────────────────────────────────────
  infoEleveContainer: {
    flexDirection:   'row',
    marginBottom:    10,
    padding:         8,
    backgroundColor: COLORS.bleuClair,
    borderRadius:    4,
    borderLeft:      `3pt solid ${COLORS.bleuMoyen}`,
    gap:             16,
  },
  infoEleveColonne: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom:  3,
  },
  infoLabel: {
    fontSize:    8,
    color:       COLORS.grisLegende,
    width:       70,
    fontFamily:  'Roboto',
    fontWeight:  700,
  },
  infoValeur: {
    fontSize:    8.5,
    color:       COLORS.grisTexte,
    flex:        1,
  },
  infoValeurGras: {
    fontSize:    9,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
    flex:        1,
  },

  // ── Tableau des notes ─────────────────────────────────────
  tableContainer: {
    marginBottom: 10,
  },
  tableTitre: {
    fontSize:        9,
    fontFamily:      'Roboto',
    fontWeight:    700,
    color:           COLORS.blanc,
    backgroundColor: COLORS.bleuPrimaire,
    padding:         5,
    marginBottom:    0,
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: '#1e40af',
    padding:         4,
    borderBottom:    `1pt solid ${COLORS.bordure}`,
  },
  tableHeaderCell: {
    color:      COLORS.blanc,
    fontSize:   7.5,
    fontFamily: 'Roboto',
    fontWeight: 700,
    textAlign:  'center',
  },
  tableRow: {
    flexDirection:  'row',
    padding:        4,
    borderBottom:   `0.5pt solid ${COLORS.bordure}`,
    alignItems:     'center',
  },
  tableRowAlt: {
    backgroundColor: COLORS.grisClair,
  },

  // Colonnes du tableau de notes
  colMatiere:    { flex: 3, fontSize: 8 },
  colCoef:       { width: 30, textAlign: 'center', fontSize: 8 },
  colNote:       { width: 40, textAlign: 'center', fontSize: 9, fontFamily: 'Roboto', fontWeight: 700 },
  colMoyClasse:  { width: 50, textAlign: 'center', fontSize: 8 },
  colRang:       { width: 30, textAlign: 'center', fontSize: 8 },
  colAppreciation: { flex: 3, fontSize: 7.5, color: COLORS.grisLegende },

  // Note absente
  noteAbsente: {
    color:      COLORS.grisLegende,
    fontStyle:  'italic',
    textAlign:  'center',
    width:      40,
    fontSize:   8,
  },

  // ── Ligne de résultats globaux ────────────────────────────
  resultatsContainer: {
    flexDirection:   'row',
    marginBottom:    10,
    gap:             8,
  },
  resultatsCard: {
    flex:            1,
    padding:         8,
    backgroundColor: COLORS.bleuClair,
    borderRadius:    4,
    alignItems:      'center',
    border:          `1pt solid ${COLORS.bleuMoyen}`,
  },
  resultatsCardLabel: {
    fontSize:  7,
    color:     COLORS.grisLegende,
    marginBottom: 2,
  },
  resultatsCardValeur: {
    fontSize:    14,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
  },
  resultatsCardSous: {
    fontSize: 7,
    color:    COLORS.grisLegende,
    marginTop: 1,
  },

  // ── Mention ───────────────────────────────────────────────
  mentionContainer: {
    padding:         6,
    borderRadius:    4,
    alignItems:      'center',
    flex:            1.5,
    justifyContent:  'center',
  },
  mentionLabel: {
    fontSize:  7,
    marginBottom: 2,
  },
  mentionValeur: {
    fontSize:    12,
    fontFamily:  'Roboto',
    fontWeight:  700,
  },

  // ── Absences ──────────────────────────────────────────────
  absencesContainer: {
    flexDirection:  'row',
    gap:            6,
    marginBottom:   10,
    padding:        6,
    border:         `1pt solid ${COLORS.bordure}`,
    borderRadius:   4,
  },
  absenceItem: {
    flex:        1,
    alignItems:  'center',
  },
  absenceValeur: {
    fontSize:    10,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.grisTexte,
  },
  absenceLabel: {
    fontSize:  7,
    color:     COLORS.grisLegende,
    textAlign: 'center',
  },

  // ── Appréciation conseil ──────────────────────────────────
  appreciationContainer: {
    marginBottom:    8,
    padding:         8,
    border:          `1pt solid ${COLORS.bordure}`,
    borderRadius:    4,
    backgroundColor: COLORS.grisClair,
  },
  appreciationTitre: {
    fontSize:    8,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
    marginBottom: 4,
  },
  appreciationTexte: {
    fontSize:    8.5,
    color:       COLORS.grisTexte,
    lineHeight:  1.5,
    minHeight:   24,
  },

  // ── Décision ─────────────────────────────────────────────
  decisionContainer: {
    padding:         6,
    border:          `1.5pt solid ${COLORS.bleuPrimaire}`,
    borderRadius:    4,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    marginBottom:    8,
  },
  decisionLabel: {
    fontSize:    8,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.bleuPrimaire,
  },
  decisionValeur: {
    fontSize:    9,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.grisTexte,
  },

  // ── Signatures ────────────────────────────────────────────
  signaturesContainer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      12,
    paddingTop:     8,
    borderTop:      `1pt solid ${COLORS.bordure}`,
  },
  signatureItem: {
    alignItems:  'center',
    flex:        1,
  },
  signatureTitre: {
    fontSize:    7.5,
    fontFamily:  'Roboto',
    fontWeight:  700,
    color:       COLORS.grisLegende,
    marginBottom: 20,
  },
  signatureLigne: {
    width:       80,
    borderBottom: `1pt solid ${COLORS.grisTexte}`,
    marginBottom: 2,
  },
  signatureNom: {
    fontSize: 7,
    color:    COLORS.grisLegende,
  },

  // ── Pied de page ──────────────────────────────────────────
  footer: {
    position:   'absolute',
    bottom:     16,
    left:       24,
    right:      24,
    borderTop:  `0.5pt solid ${COLORS.bordure}`,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6.5,
    color:    COLORS.grisLegende,
  },
});

// ------------------------------------------------------------
// HELPER — Couleur de mention selon la moyenne
// Système de notation sénégalais (0-20)
// ------------------------------------------------------------
function couleurMention(mention: string): string {
  if (['Très Bien', 'Excellence'].includes(mention)) return COLORS.vertSucces;
  if (['Bien', 'Assez Bien'].includes(mention))       return COLORS.bleuMoyen;
  if (mention === 'Passable')                          return COLORS.orMoyen;
  return COLORS.rougeDanger;
}

// ------------------------------------------------------------
// HELPER — Formater une note sur 20
// ------------------------------------------------------------
function formatNote(note: number | null): string {
  if (note === null || note === undefined) return '—';
  return note.toFixed(2);
}

// ------------------------------------------------------------
// HELPER — Calculer la note pondérée (note × coef)
// ------------------------------------------------------------
function notePonderee(note: number | null, coef: number): string {
  if (note === null) return '—';
  return (note * coef).toFixed(2);
}

// ------------------------------------------------------------
// COMPOSANT — Ligne du tableau de notes
// ------------------------------------------------------------
interface LigneNoteProps {
  noteMatiere: NoteMatiere;
  index: number;
}

const LigneNote: React.FC<LigneNoteProps> = ({ noteMatiere, index }) => {
  const estAlt = index % 2 === 1;
  return (
    <View style={[styles.tableRow, estAlt ? styles.tableRowAlt : {}]}>
      {/* Matière */}
      <Text style={styles.colMatiere}>{noteMatiere.matiere}</Text>

      {/* Coefficient */}
      <Text style={styles.colCoef}>{noteMatiere.coefficient}</Text>

      {/* Note de l'élève — colorée selon le niveau */}
      {noteMatiere.note !== null ? (
        <Text style={[
          styles.colNote,
          { color: noteMatiere.note >= 10 ? COLORS.grisTexte : COLORS.rougeDanger }
        ]}>
          {formatNote(noteMatiere.note)}
        </Text>
      ) : (
        <Text style={styles.noteAbsente}>Abs.</Text>
      )}

      {/* Moyenne de la classe */}
      <Text style={styles.colMoyClasse}>
        {noteMatiere.moyenneClasse ? formatNote(noteMatiere.moyenneClasse) : '—'}
      </Text>

      {/* Rang */}
      <Text style={styles.colRang}>
        {noteMatiere.rang ? `${noteMatiere.rang}er` : '—'}
      </Text>

      {/* Appréciation du prof */}
      <Text style={styles.colAppreciation}>
        {noteMatiere.appreciation || ''}
      </Text>
    </View>
  );
};

// ------------------------------------------------------------
// COMPOSANT PRINCIPAL — Document bulletin
// Exporté pour utilisation avec @react-pdf/renderer
// ------------------------------------------------------------
interface BulletinPDFProps {
  donnees: DonneesBulletin;
}

const BulletinPDF: React.FC<BulletinPDFProps> = ({ donnees }) => {
  const { etablissement, trimestre, eleve, notes, resultats, absences } = donnees;

  // Noms des trimestres selon terminologie sénégalaise
  const nomTrimestre = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'][trimestre - 1];

  // Couleur de la mention
  const couleurMentionCourante = couleurMention(resultats.mention);

  return (
    <Document
      title={`Bulletin ${eleve.nom} ${eleve.prenom} — ${nomTrimestre}`}
      author="PedaClic Pro"
      subject="Bulletin scolaire"
      creator="PedaClic Pro Desktop"
    >
      <Page size="A4" style={styles.page}>

        {/* ── EN-TÊTE ÉTABLISSEMENT ──────────────────────── */}
        <View style={styles.headerContainer}>
          {/* Logo établissement */}
          <Image
            src={logoEtablissement}
            style={styles.logoEtablissement}
          />
          {/* Gauche : infos établissement */}
          <View style={styles.headerLeft}>
            <Text style={styles.etatRepublique}>
              RÉPUBLIQUE DU SÉNÉGAL
            </Text>
            <Text style={styles.etatRepublique}>
              Ministère de l'Éducation Nationale
            </Text>
            <Text style={styles.nomEtablissement}>
              {etablissement.nom}
            </Text>
            <Text style={styles.adresseEtablissement}>
              {etablissement.adresse} — {etablissement.ville}
            </Text>
            {etablissement.telephone && (
              <Text style={styles.adresseEtablissement}>
                Tél : {etablissement.telephone}
              </Text>
            )}
          </View>

          {/* Droite : titre du document */}
          <View style={styles.headerRight}>
            <Text style={styles.titreBulletin}>Bulletin de Notes</Text>
            <Text style={styles.sousTitreBulletin}>{nomTrimestre}</Text>
            <Text style={styles.sousTitreBulletin}>
              Année scolaire {etablissement.anneeScolaire}
            </Text>
          </View>
        </View>

        {/* ── INFOS ÉLÈVE ───────────────────────────────── */}
        <View style={styles.infoEleveContainer}>
          {/* Colonne 1 : identité */}
          <View style={styles.infoEleveColonne}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom & Prénom</Text>
              <Text style={styles.infoValeurGras}>
                {eleve.nom.toUpperCase()} {eleve.prenom}
              </Text>
            </View>
            {eleve.matricule && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Matricule</Text>
                <Text style={styles.infoValeur}>{eleve.matricule}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Classe</Text>
              <Text style={styles.infoValeurGras}>{eleve.classe}</Text>
            </View>
          </View>

          {/* Colonne 2 : naissance + dates */}
          <View style={styles.infoEleveColonne}>
            {eleve.dateNaissance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Né(e) le</Text>
                <Text style={styles.infoValeur}>{eleve.dateNaissance}</Text>
              </View>
            )}
            {eleve.lieuNaissance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>À</Text>
                <Text style={styles.infoValeur}>{eleve.lieuNaissance}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Édité le</Text>
              <Text style={styles.infoValeur}>{donnees.dateEdition}</Text>
            </View>
          </View>
        </View>

        {/* ── TABLEAU DES NOTES ─────────────────────────── */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitre}>Résultats par matière</Text>

          {/* En-tête du tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colMatiere]}>
              MATIÈRE
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCoef]}>
              COEF.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colNote]}>
              NOTE /20
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colMoyClasse]}>
              MOY. CLASSE
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colRang]}>
              RANG
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAppreciation]}>
              APPRÉCIATION
            </Text>
          </View>

          {/* Lignes de notes */}
          {notes.map((note, index) => (
            <LigneNote
              key={`note-${index}`}
              noteMatiere={note}
              index={index}
            />
          ))}
        </View>

        {/* ── RÉSULTATS GLOBAUX ─────────────────────────── */}
        <View style={styles.resultatsContainer}>
          {/* Moyenne générale */}
          <View style={styles.resultatsCard}>
            <Text style={styles.resultatsCardLabel}>MOYENNE GÉNÉRALE</Text>
            <Text style={[
              styles.resultatsCardValeur,
              { color: resultats.moyenneGenerale >= 10 ? COLORS.vertSucces : COLORS.rougeDanger }
            ]}>
              {resultats.moyenneGenerale.toFixed(2)}/20
            </Text>
            <Text style={styles.resultatsCardSous}>
              Moy. classe : {resultats.moyenneClasse.toFixed(2)}
            </Text>
          </View>

          {/* Rang */}
          <View style={styles.resultatsCard}>
            <Text style={styles.resultatsCardLabel}>RANG</Text>
            <Text style={styles.resultatsCardValeur}>
              {resultats.rangClasse}
              <Text style={{ fontSize: 8 }}>/{resultats.effectifClasse}</Text>
            </Text>
            <Text style={styles.resultatsCardSous}>
              {resultats.effectifClasse} élèves
            </Text>
          </View>

          {/* Mention */}
          <View style={[
            styles.mentionContainer,
            { backgroundColor: couleurMentionCourante + '20', border: `1.5pt solid ${couleurMentionCourante}` }
          ]}>
            <Text style={[styles.mentionLabel, { color: couleurMentionCourante }]}>
              MENTION
            </Text>
            <Text style={[styles.mentionValeur, { color: couleurMentionCourante }]}>
              {resultats.mention}
            </Text>
          </View>
        </View>

        {/* ── ABSENCES ──────────────────────────────────── */}
        <View style={styles.absencesContainer}>
          <Text style={[styles.absenceLabel, { fontFamily: 'Roboto',
    fontWeight: 700, fontSize: 8, flex: 0, marginRight: 8 }]}>
            ABSENCES :
          </Text>
          <View style={styles.absenceItem}>
            <Text style={styles.absenceValeur}>{absences.totalHeures}h</Text>
            <Text style={styles.absenceLabel}>Total</Text>
          </View>
          <View style={styles.absenceItem}>
            <Text style={[
              styles.absenceValeur,
              { color: absences.nonJustifiees > 0 ? COLORS.rougeDanger : COLORS.vertSucces }
            ]}>
              {absences.nonJustifiees}h
            </Text>
            <Text style={styles.absenceLabel}>Non justifiées</Text>
          </View>
          <View style={styles.absenceItem}>
            <Text style={styles.absenceValeur}>
              {absences.totalHeures - absences.nonJustifiees}h
            </Text>
            <Text style={styles.absenceLabel}>Justifiées</Text>
          </View>
        </View>

        {/* ── APPRÉCIATION DU CONSEIL ───────────────────── */}
        <View style={styles.appreciationContainer}>
          <Text style={styles.appreciationTitre}>
            Appréciation du Conseil de Classe
          </Text>
          <Text style={styles.appreciationTexte}>
            {resultats.appreciationConseil || ''}
          </Text>
        </View>

        {/* ── DÉCISION DU CONSEIL ───────────────────────── */}
        {donnees.decision && (
          <View style={styles.decisionContainer}>
            <Text style={styles.decisionLabel}>DÉCISION :</Text>
            <Text style={styles.decisionValeur}>{donnees.decision}</Text>
          </View>
        )}

        {/* ── SIGNATURES ────────────────────────────────── */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>Le Professeur Principal</Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>Le Chef d'Établissement</Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>Signature du Parent/Tuteur</Text>
            <View style={styles.signatureLigne} />
            <Text style={styles.signatureNom}>Vu et pris connaissance</Text>
          </View>
        </View>

        {/* ── PIED DE PAGE ──────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            PedaClic Pro — {etablissement.nom}
          </Text>
          <Text style={styles.footerText}>
            {eleve.nom} {eleve.prenom} — {nomTrimestre} {etablissement.anneeScolaire}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default BulletinPDF;
