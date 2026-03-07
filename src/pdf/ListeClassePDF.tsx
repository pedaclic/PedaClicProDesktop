// ============================================================
// PedaClic Pro Desktop — Liste de Classe PDF
// Templates : liste d'appel, feuille de composition
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================
// Librairie : @react-pdf/renderer
// ============================================================

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DonneesListeClasse, EleveListeClasse } from '../types/pdfTypes';

// ------------------------------------------------------------
// PALETTE — Cohérente avec BulletinPDF.tsx
// ------------------------------------------------------------
const COLORS = {
  bleuPrimaire: '#1e3a8a',
  bleuMoyen:    '#2563eb',
  bleuClair:    '#dbeafe',
  grisTexte:    '#374151',
  grisLegende:  '#6b7280',
  grisClair:    '#f9fafb',
  blanc:        '#ffffff',
  bordure:      '#d1d5db',
  bordureFoncee: '#9ca3af',
};

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────
  page: {
    fontFamily:      'Helvetica',
    fontSize:        8.5,
    color:           COLORS.grisTexte,
    padding:         20,
    backgroundColor: COLORS.blanc,
  },
  pagePaysage: {
    fontFamily:      'Helvetica',
    fontSize:        8,
    color:           COLORS.grisTexte,
    padding:         20,
    backgroundColor: COLORS.blanc,
  },

  // ── En-tête ───────────────────────────────────────────────
  header: {
    marginBottom:  10,
    borderBottom:  `2pt solid ${COLORS.bleuPrimaire}`,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  etatTexte: {
    fontSize: 7,
    color:    COLORS.grisLegende,
    marginBottom: 1,
  },
  nomEtablissement: {
    fontSize:   11,
    fontFamily: 'Helvetica-Bold',
    color:      COLORS.bleuPrimaire,
  },
  adresse: {
    fontSize: 7.5,
    color:    COLORS.grisLegende,
  },
  titrePrincipal: {
    fontSize:    13,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuPrimaire,
    textAlign:   'right',
  },
  sousTitre: {
    fontSize:  8.5,
    color:     COLORS.bleuMoyen,
    textAlign: 'right',
  },

  // ── Bandeau info classe ───────────────────────────────────
  infoClasseContainer: {
    flexDirection:   'row',
    gap:             8,
    marginBottom:    10,
    padding:         6,
    backgroundColor: COLORS.bleuClair,
    borderRadius:    4,
  },
  infoClasseItem: {
    flex:        1,
    flexDirection: 'row',
    gap:           4,
  },
  infoClasseLabel: {
    fontSize:   7.5,
    color:      COLORS.grisLegende,
    fontFamily: 'Helvetica-Bold',
  },
  infoClasseValeur: {
    fontSize: 7.5,
    color:    COLORS.grisTexte,
  },

  // ── Tableau liste d'appel ─────────────────────────────────
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: COLORS.bleuPrimaire,
    padding:         4,
  },
  tableHeaderCell: {
    color:      COLORS.blanc,
    fontSize:   7.5,
    fontFamily: 'Helvetica-Bold',
    textAlign:  'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom:  `0.5pt solid ${COLORS.bordure}`,
    padding:       3,
    minHeight:     16,
    alignItems:    'center',
  },
  tableRowAlt: {
    backgroundColor: COLORS.grisClair,
  },

  // Colonnes — Liste d'appel portrait
  colNum:         { width: 22, textAlign: 'center', fontSize: 8 },
  colMatricule:   { width: 52, textAlign: 'center', fontSize: 7.5, color: COLORS.grisLegende },
  colNomPrenom:   { flex: 3, fontSize: 8 },
  colSexe:        { width: 22, textAlign: 'center', fontSize: 8 },
  colNaissance:   { width: 60, textAlign: 'center', fontSize: 7.5 },
  colCaseJour:    { width: 14, textAlign: 'center', borderLeft: `0.5pt solid ${COLORS.bordure}` },

  // Colonnes — Feuille de composition
  colNumComp:     { width: 22, textAlign: 'center', fontSize: 8 },
  colNomComp:     { flex: 3, fontSize: 8 },
  colNote1:       { width: 40, textAlign: 'center', borderLeft: `0.5pt solid ${COLORS.bordure}` },
  colNote2:       { width: 40, textAlign: 'center', borderLeft: `0.5pt solid ${COLORS.bordure}` },
  colNote3:       { width: 40, textAlign: 'center', borderLeft: `0.5pt solid ${COLORS.bordure}` },
  colMoyenne:     { width: 50, textAlign: 'center', borderLeft: `1pt solid ${COLORS.bleuMoyen}`, fontFamily: 'Helvetica-Bold' },
  colRang:        { width: 30, textAlign: 'center', borderLeft: `0.5pt solid ${COLORS.bordure}` },
  colObs:         { flex: 2, borderLeft: `0.5pt solid ${COLORS.bordure}`, fontSize: 7.5, color: COLORS.grisLegende },

  // ── Cases à cocher jours ──────────────────────────────────
  caseJour: {
    width:        12,
    height:       10,
    border:       `0.5pt solid ${COLORS.bordureFoncee}`,
    margin:       1,
  },

  // ── Stats en bas de page ──────────────────────────────────
  statsContainer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      12,
    paddingTop:     6,
    borderTop:      `1pt solid ${COLORS.bordure}`,
  },
  statItem: {
    alignItems: 'center',
    flex:       1,
  },
  statValeur: {
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
    color:      COLORS.bleuPrimaire,
  },
  statLabel: {
    fontSize: 7,
    color:    COLORS.grisLegende,
  },

  // ── Signatures ────────────────────────────────────────────
  signaturesRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      16,
  },
  signatureCol: {
    alignItems: 'center',
    flex:        1,
  },
  signatureTitre: {
    fontSize:    7.5,
    color:       COLORS.grisLegende,
    marginBottom: 20,
  },
  signatureLigne: {
    width:        80,
    borderBottom: `0.8pt solid ${COLORS.grisTexte}`,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    position:   'absolute',
    bottom:     12,
    left:       20,
    right:      20,
    borderTop:  `0.5pt solid ${COLORS.bordure}`,
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6.5,
    color:    COLORS.grisLegende,
  },

  // ── Légende en bas ────────────────────────────────────────
  legendeContainer: {
    marginTop:  6,
    padding:    4,
    border:     `0.5pt solid ${COLORS.bordure}`,
    borderRadius: 3,
  },
  legendeTitre: {
    fontSize:    7,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuMoyen,
    marginBottom: 2,
  },
  legendeTexte: {
    fontSize: 6.5,
    color:    COLORS.grisLegende,
  },
});

// ------------------------------------------------------------
// HELPER — Nom complet formaté (NOM Prénom)
// ------------------------------------------------------------
function nomComplet(eleve: EleveListeClasse): string {
  return `${eleve.nom.toUpperCase()} ${eleve.prenom}`;
}

// ------------------------------------------------------------
// COMPOSANT — En-tête commun aux deux types de listes
// ------------------------------------------------------------
interface HeaderListeProps {
  donnees: DonneesListeClasse;
  titrePrincipal: string;
}

const HeaderListe: React.FC<HeaderListeProps> = ({ donnees, titrePrincipal }) => (
  <View style={styles.header}>
    <View style={styles.headerRow}>
      {/* Gauche */}
      <View>
        <Text style={styles.etatTexte}>RÉPUBLIQUE DU SÉNÉGAL</Text>
        <Text style={styles.etatTexte}>Ministère de l'Éducation Nationale</Text>
        <Text style={styles.nomEtablissement}>{donnees.etablissement.nom}</Text>
        <Text style={styles.adresse}>{donnees.etablissement.adresse} — {donnees.etablissement.ville}</Text>
      </View>
      {/* Droite */}
      <View>
        <Text style={styles.titrePrincipal}>{titrePrincipal}</Text>
        <Text style={styles.sousTitre}>Classe : {donnees.classe}</Text>
        <Text style={styles.sousTitre}>Année {donnees.etablissement.anneeScolaire}</Text>
        {donnees.date && (
          <Text style={styles.sousTitre}>Date : {donnees.date}</Text>
        )}
      </View>
    </View>

    {/* Bandeau infos */}
    <View style={[styles.infoClasseContainer, { marginTop: 6, marginBottom: 0 }]}>
      <View style={styles.infoClasseItem}>
        <Text style={styles.infoClasseLabel}>Effectif : </Text>
        <Text style={styles.infoClasseValeur}>{donnees.eleves.length} élèves</Text>
      </View>
      <View style={styles.infoClasseItem}>
        <Text style={styles.infoClasseLabel}>Garçons : </Text>
        <Text style={styles.infoClasseValeur}>
          {donnees.eleves.filter(e => e.sexe === 'M').length}
        </Text>
      </View>
      <View style={styles.infoClasseItem}>
        <Text style={styles.infoClasseLabel}>Filles : </Text>
        <Text style={styles.infoClasseValeur}>
          {donnees.eleves.filter(e => e.sexe === 'F').length}
        </Text>
      </View>
      {donnees.professeurPrincipal && (
        <View style={styles.infoClasseItem}>
          <Text style={styles.infoClasseLabel}>Prof. principal : </Text>
          <Text style={styles.infoClasseValeur}>{donnees.professeurPrincipal}</Text>
        </View>
      )}
      {donnees.matiere && (
        <View style={styles.infoClasseItem}>
          <Text style={styles.infoClasseLabel}>Matière : </Text>
          <Text style={[styles.infoClasseValeur, { fontFamily: 'Helvetica-Bold' }]}>
            {donnees.matiere}
          </Text>
        </View>
      )}
    </View>
  </View>
);

// ------------------------------------------------------------
// COMPOSANT — Liste d'appel
// Format portrait, avec 7 colonnes de cases à cocher (jours)
// ------------------------------------------------------------
const ListeAppelPDF: React.FC<{ donnees: DonneesListeClasse }> = ({ donnees }) => {
  // Jours de la semaine pour les cases à cocher
  const joursAbrv = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Document
      title={`Liste d'appel — ${donnees.classe}`}
      author="PedaClic Pro"
    >
      <Page size="A4" orientation="landscape" style={styles.pagePaysage}>
        <HeaderListe donnees={donnees} titrePrincipal="LISTE D'APPEL" />

        {/* Tableau */}
        <View style={styles.table}>
          {/* En-tête colonnes */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNum]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colMatricule]}>Matricule</Text>
            <Text style={[styles.tableHeaderCell, styles.colNomPrenom]}>Nom & Prénom</Text>
            <Text style={[styles.tableHeaderCell, styles.colSexe]}>Sexe</Text>
            <Text style={[styles.tableHeaderCell, styles.colNaissance]}>Date Naissance</Text>
            {/* 14 cases pour 2 semaines */}
            {Array.from({ length: 14 }).map((_, i) => (
              <Text key={i} style={[styles.tableHeaderCell, styles.colCaseJour]}>
                {joursAbrv[i % 7]}
              </Text>
            ))}
          </View>

          {/* Lignes élèves */}
          {donnees.eleves.map((eleve, index) => (
            <View
              key={eleve.matricule || index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colNum}>{eleve.numero}</Text>
              <Text style={styles.colMatricule}>{eleve.matricule || '—'}</Text>
              <Text style={styles.colNomPrenom}>
                {nomComplet(eleve)}
                {eleve.redoublant ? ' (R)' : ''}
              </Text>
              <Text style={styles.colSexe}>{eleve.sexe}</Text>
              <Text style={styles.colNaissance}>{eleve.dateNaissance || '—'}</Text>
              {/* Cases à cocher vides */}
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={[styles.colCaseJour, { padding: 0, justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={styles.caseJour} />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Légende */}
        <View style={styles.legendeContainer}>
          <Text style={styles.legendeTitre}>Légende</Text>
          <Text style={styles.legendeTexte}>
            A = Absent | J = Justifié | R = Retard | (R) = Redoublant
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValeur}>{donnees.eleves.length}</Text>
            <Text style={styles.statLabel}>Effectif total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValeur}>
              {donnees.eleves.filter(e => e.sexe === 'M').length}
            </Text>
            <Text style={styles.statLabel}>Garçons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValeur}>
              {donnees.eleves.filter(e => e.sexe === 'F').length}
            </Text>
            <Text style={styles.statLabel}>Filles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValeur}>
              {donnees.eleves.filter(e => e.redoublant).length}
            </Text>
            <Text style={styles.statLabel}>Redoublants</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>PedaClic Pro — {donnees.etablissement.nom}</Text>
          <Text style={styles.footerText}>
            Liste d'appel — {donnees.classe} — {donnees.etablissement.anneeScolaire}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

// ------------------------------------------------------------
// COMPOSANT — Feuille de composition
// 3 colonnes de notes + moyenne + rang + observations
// ------------------------------------------------------------
const FeuilleCompositionPDF: React.FC<{ donnees: DonneesListeClasse }> = ({ donnees }) => {
  const nomTrimestre = donnees.trimestre
    ? ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'][donnees.trimestre - 1]
    : '';

  return (
    <Document
      title={`Feuille de composition — ${donnees.classe} — ${donnees.matiere}`}
      author="PedaClic Pro"
    >
      <Page size="A4" orientation="landscape" style={styles.pagePaysage}>
        <HeaderListe
          donnees={donnees}
          titrePrincipal={`FEUILLE DE COMPOSITION — ${nomTrimestre}`}
        />

        {/* Tableau des notes */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNumComp]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colNomComp]}>Nom & Prénom</Text>
            <Text style={[styles.tableHeaderCell, styles.colNote1]}>Note 1</Text>
            <Text style={[styles.tableHeaderCell, styles.colNote2]}>Note 2</Text>
            <Text style={[styles.tableHeaderCell, styles.colNote3]}>Note 3</Text>
            <Text style={[styles.tableHeaderCell, styles.colMoyenne]}>MOYENNE</Text>
            <Text style={[styles.tableHeaderCell, styles.colRang]}>Rang</Text>
            <Text style={[styles.tableHeaderCell, styles.colObs]}>Observations</Text>
          </View>

          {donnees.eleves.map((eleve, index) => (
            <View
              key={eleve.matricule || index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}, { minHeight: 14 }]}
            >
              <Text style={styles.colNumComp}>{eleve.numero}</Text>
              <Text style={styles.colNomComp}>{nomComplet(eleve)}</Text>
              {/* Colonnes de notes vides à remplir à la main */}
              <Text style={[styles.colNote1, { minHeight: 12 }]}></Text>
              <Text style={[styles.colNote2, { minHeight: 12 }]}></Text>
              <Text style={[styles.colNote3, { minHeight: 12 }]}></Text>
              <Text style={[styles.colMoyenne, { minHeight: 12 }]}></Text>
              <Text style={[styles.colRang, { minHeight: 12 }]}></Text>
              <Text style={[styles.colObs, { minHeight: 12 }]}></Text>
            </View>
          ))}
        </View>

        {/* Espace signatures */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureCol}>
            <Text style={styles.signatureTitre}>Professeur de {donnees.matiere || 'la matière'}</Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureCol}>
            <Text style={styles.signatureTitre}>Surveillant Général</Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureCol}>
            <Text style={styles.signatureTitre}>Le Chef d'Établissement</Text>
            <View style={styles.signatureLigne} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>PedaClic Pro — {donnees.etablissement.nom}</Text>
          <Text style={styles.footerText}>
            {donnees.matiere} — {donnees.classe} — {nomTrimestre} {donnees.etablissement.anneeScolaire}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

// ------------------------------------------------------------
// COMPOSANT PRINCIPAL — Sélectionne le bon template
// ------------------------------------------------------------
interface ListeClassePDFProps {
  donnees: DonneesListeClasse;
}

const ListeClassePDF: React.FC<ListeClassePDFProps> = ({ donnees }) => {
  if (donnees.typeDocument === 'composition') {
    return <FeuilleCompositionPDF donnees={donnees} />;
  }
  // Défaut : liste d'appel
  return <ListeAppelPDF donnees={donnees} />;
};

export default ListeClassePDF;
export { ListeAppelPDF, FeuilleCompositionPDF };
