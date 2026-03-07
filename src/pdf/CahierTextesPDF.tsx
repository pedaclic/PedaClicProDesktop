// ============================================================
// PedaClic Pro Desktop — Cahier de Textes PDF
// Export formaté pour inspection pédagogique
// www.pedaclic.sn | Auteur : Kadou / PedaClic
// ============================================================

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DonneesCahierTextes, SeanceCahier } from '../types/pdfTypes';

const COLORS = {
  bleuPrimaire:  '#1e3a8a',
  bleuMoyen:     '#2563eb',
  bleuClair:     '#dbeafe',
  vertAccent:    '#059669',
  vertClair:     '#d1fae5',
  grisTexte:     '#374151',
  grisLegende:   '#6b7280',
  grisClair:     '#f9fafb',
  blanc:         '#ffffff',
  bordure:       '#d1d5db',
  ambreAccent:   '#d97706',
  ambreClair:    '#fef3c7',
};

const styles = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        9,
    color:           COLORS.grisTexte,
    padding:         24,
    backgroundColor: COLORS.blanc,
  },

  // ── En-tête ───────────────────────────────────────────────
  header: {
    marginBottom:  12,
    paddingBottom: 8,
    borderBottom:  `2pt solid ${COLORS.bleuPrimaire}`,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   8,
  },
  etatTexte: {
    fontSize: 7,
    color:    COLORS.grisLegende,
    marginBottom: 1,
  },
  nomEtablissement: {
    fontSize:    11,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuPrimaire,
    marginBottom: 2,
  },
  adresse: {
    fontSize: 7.5,
    color:    COLORS.grisLegende,
  },
  titreDroit: {
    textAlign:  'right',
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

  // ── Bandeau infos cours ───────────────────────────────────
  infosBandeau: {
    flexDirection:   'row',
    gap:             8,
    padding:         6,
    backgroundColor: COLORS.bleuClair,
    borderRadius:    4,
    flexWrap:        'wrap',
  },
  infosItem: {
    flexDirection: 'row',
    gap:           3,
    flex:          1,
    minWidth:      100,
  },
  infosLabel: {
    fontSize:   7.5,
    fontFamily: 'Helvetica-Bold',
    color:      COLORS.grisLegende,
  },
  infosValeur: {
    fontSize: 7.5,
    color:    COLORS.grisTexte,
  },

  // ── Statistiques progression ──────────────────────────────
  statsContainer: {
    flexDirection:   'row',
    gap:             6,
    marginBottom:    12,
    marginTop:       8,
  },
  statCard: {
    flex:            1,
    padding:         6,
    borderRadius:    4,
    alignItems:      'center',
    border:          `1pt solid ${COLORS.bordure}`,
  },
  statValeur: {
    fontSize:    12,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuPrimaire,
  },
  statLabel: {
    fontSize: 6.5,
    color:    COLORS.grisLegende,
    textAlign: 'center',
  },

  // ── Barre de progression ──────────────────────────────────
  progressContainer: {
    marginBottom:    12,
    padding:         6,
    border:          `1pt solid ${COLORS.bordure}`,
    borderRadius:    4,
  },
  progressLabel: {
    fontSize:    7.5,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuPrimaire,
    marginBottom: 4,
  },
  progressBarBg: {
    height:          10,
    backgroundColor: COLORS.grisClair,
    borderRadius:    5,
    overflow:        'hidden',
    border:          `0.5pt solid ${COLORS.bordure}`,
  },
  progressBarFill: {
    height:          10,
    backgroundColor: COLORS.vertAccent,
    borderRadius:    5,
  },
  progressPct: {
    fontSize:    7,
    color:       COLORS.grisLegende,
    textAlign:   'right',
    marginTop:   2,
  },

  // ── Carte d'une séance ────────────────────────────────────
  seanceCard: {
    marginBottom:  8,
    border:        `1pt solid ${COLORS.bordure}`,
    borderRadius:  4,
    overflow:      'hidden',
  },
  seanceHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         5,
    backgroundColor: COLORS.bleuClair,
    borderBottom:    `0.5pt solid ${COLORS.bordure}`,
  },
  seanceNumero: {
    width:      20,
    height:     18,
    backgroundColor: COLORS.bleuMoyen,
    borderRadius: 10,
    alignItems:  'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  seanceNumeroText: {
    color:      COLORS.blanc,
    fontSize:   7.5,
    fontFamily: 'Helvetica-Bold',
  },
  seanceHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  seanceTitre: {
    fontSize:    9,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuPrimaire,
    flex:        1,
  },
  seanceDateHoraire: {
    fontSize:    8,
    color:       COLORS.grisLegende,
    textAlign:   'right',
  },
  seanceCorps: {
    padding: 6,
  },
  seanceContenu: {
    fontSize:    8.5,
    color:       COLORS.grisTexte,
    lineHeight:  1.5,
    marginBottom: 4,
  },
  seanceSectionTitre: {
    fontSize:    7.5,
    fontFamily:  'Helvetica-Bold',
    color:       COLORS.bleuMoyen,
    marginTop:   4,
    marginBottom: 2,
  },
  travailFaire: {
    fontSize:        8,
    color:           COLORS.ambreAccent,
    lineHeight:      1.4,
    padding:         4,
    backgroundColor: COLORS.ambreClair,
    borderRadius:    3,
    borderLeft:      `2pt solid ${COLORS.ambreAccent}`,
  },
  observations: {
    fontSize:        7.5,
    color:           COLORS.grisLegende,
    fontStyle:       'italic',
    marginTop:       3,
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    position:   'absolute',
    bottom:     14,
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

  // ── Signatures fin de document ────────────────────────────
  signaturesContainer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      16,
    paddingTop:     8,
    borderTop:      `1pt solid ${COLORS.bordure}`,
  },
  signatureItem: {
    alignItems: 'center',
    flex:       1,
  },
  signatureTitre: {
    fontSize:    7.5,
    color:       COLORS.grisLegende,
    marginBottom: 20,
    textAlign:   'center',
  },
  signatureLigne: {
    width:        80,
    borderBottom: `0.8pt solid ${COLORS.grisTexte}`,
    marginBottom: 2,
  },
});

// ------------------------------------------------------------
// COMPOSANT — Une carte de séance
// ------------------------------------------------------------
interface SeanceCardProps {
  seance: SeanceCahier;
  numero: number;
}

const SeanceCard: React.FC<SeanceCardProps> = ({ seance, numero }) => (
  <View style={styles.seanceCard} wrap={false}>
    {/* En-tête de la séance */}
    <View style={styles.seanceHeader}>
      <View style={styles.seanceHeaderLeft}>
        <View style={styles.seanceNumero}>
          <Text style={styles.seanceNumeroText}>{numero}</Text>
        </View>
        <Text style={styles.seanceTitre}>{seance.titre}</Text>
      </View>
      <View>
        <Text style={styles.seanceDateHoraire}>{seance.date}</Text>
        {seance.horaire && (
          <Text style={styles.seanceDateHoraire}>{seance.horaire}</Text>
        )}
        {seance.duree && (
          <Text style={styles.seanceDateHoraire}>{seance.duree}h</Text>
        )}
      </View>
    </View>

    {/* Corps de la séance */}
    <View style={styles.seanceCorps}>
      {/* Contenu principal */}
      <Text style={styles.seanceSectionTitre}>Contenu de la séance :</Text>
      <Text style={styles.seanceContenu}>{seance.contenu}</Text>

      {/* Travail à faire */}
      {seance.travailFaire && (
        <>
          <Text style={styles.seanceSectionTitre}>📋 Travail à faire :</Text>
          <Text style={styles.travailFaire}>{seance.travailFaire}</Text>
        </>
      )}

      {/* Observations */}
      {seance.observations && (
        <Text style={styles.observations}>Obs. : {seance.observations}</Text>
      )}
    </View>
  </View>
);

// ------------------------------------------------------------
// COMPOSANT PRINCIPAL — Document cahier de textes
// ------------------------------------------------------------
interface CahierTextesPDFProps {
  donnees: DonneesCahierTextes;
}

const CahierTextesPDF: React.FC<CahierTextesPDFProps> = ({ donnees }) => {
  // Calculer le pourcentage de progression
  const pourcentageProgression = donnees.totalHeuresPrevues
    ? Math.min(100, Math.round((donnees.totalHeuresEffectuees / donnees.totalHeuresPrevues) * 100))
    : null;

  return (
    <Document
      title={`Cahier de textes — ${donnees.matiere} — ${donnees.classe}`}
      author="PedaClic Pro"
      subject="Cahier de textes pédagogique"
    >
      <Page size="A4" style={styles.page}>

        {/* ── EN-TÊTE ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Gauche */}
            <View>
              <Text style={styles.etatTexte}>RÉPUBLIQUE DU SÉNÉGAL</Text>
              <Text style={styles.etatTexte}>Ministère de l'Éducation Nationale</Text>
              <Text style={styles.nomEtablissement}>{donnees.etablissement.nom}</Text>
              <Text style={styles.adresse}>
                {donnees.etablissement.adresse} — {donnees.etablissement.ville}
              </Text>
            </View>
            {/* Droite */}
            <View style={styles.titreDroit}>
              <Text style={styles.titrePrincipal}>CAHIER DE TEXTES</Text>
              <Text style={styles.sousTitre}>{donnees.matiere}</Text>
              <Text style={styles.sousTitre}>Classe : {donnees.classe}</Text>
              <Text style={styles.sousTitre}>{donnees.periode}</Text>
            </View>
          </View>

          {/* Bandeau infos */}
          <View style={styles.infosBandeau}>
            <View style={styles.infosItem}>
              <Text style={styles.infosLabel}>Professeur : </Text>
              <Text style={styles.infosValeur}>{donnees.nomProf}</Text>
            </View>
            <View style={styles.infosItem}>
              <Text style={styles.infosLabel}>Matière : </Text>
              <Text style={styles.infosValeur}>{donnees.matiere}</Text>
            </View>
            <View style={styles.infosItem}>
              <Text style={styles.infosLabel}>Classe : </Text>
              <Text style={styles.infosValeur}>{donnees.classe}</Text>
            </View>
            <View style={styles.infosItem}>
              <Text style={styles.infosLabel}>Année scolaire : </Text>
              <Text style={styles.infosValeur}>{donnees.anneeScolaire}</Text>
            </View>
            <View style={styles.infosItem}>
              <Text style={styles.infosLabel}>Période : </Text>
              <Text style={styles.infosValeur}>{donnees.periode}</Text>
            </View>
          </View>
        </View>

        {/* ── STATS DE PROGRESSION ────────────────────────── */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValeur}>{donnees.seances.length}</Text>
            <Text style={styles.statLabel}>Séances effectuées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValeur}>{donnees.totalHeuresEffectuees}h</Text>
            <Text style={styles.statLabel}>Heures effectuées</Text>
          </View>
          {donnees.totalHeuresPrevues && (
            <View style={styles.statCard}>
              <Text style={styles.statValeur}>{donnees.totalHeuresPrevues}h</Text>
              <Text style={styles.statLabel}>Heures prévues</Text>
            </View>
          )}
          {pourcentageProgression !== null && (
            <View style={[styles.statCard, {
              backgroundColor: pourcentageProgression >= 80
                ? COLORS.vertClair
                : COLORS.ambreClair
            }]}>
              <Text style={[styles.statValeur, {
                color: pourcentageProgression >= 80
                  ? COLORS.vertAccent
                  : COLORS.ambreAccent
              }]}>
                {pourcentageProgression}%
              </Text>
              <Text style={styles.statLabel}>Progression</Text>
            </View>
          )}
        </View>

        {/* ── BARRE DE PROGRESSION ────────────────────────── */}
        {pourcentageProgression !== null && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progression du programme</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${pourcentageProgression}%` }]} />
            </View>
            <Text style={styles.progressPct}>
              {donnees.totalHeuresEffectuees}h / {donnees.totalHeuresPrevues}h
              ({pourcentageProgression}%)
            </Text>
          </View>
        )}

        {/* ── SÉANCES ─────────────────────────────────────── */}
        {donnees.seances.map((seance, index) => (
          <SeanceCard
            key={`seance-${index}`}
            seance={seance}
            numero={index + 1}
          />
        ))}

        {/* ── SIGNATURES ──────────────────────────────────── */}
        <View style={styles.signaturesContainer} wrap={false}>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>
              Le Professeur{'\n'}{donnees.nomProf}
            </Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>
              Le Censeur / C.P.
            </Text>
            <View style={styles.signatureLigne} />
          </View>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureTitre}>
              Le Chef d'Établissement
            </Text>
            <View style={styles.signatureLigne} />
          </View>
        </View>

        {/* ── FOOTER ──────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>PedaClic Pro — {donnees.etablissement.nom}</Text>
          <Text style={styles.footerText}>
            Cahier de textes — {donnees.matiere} — {donnees.classe}
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

export default CahierTextesPDF;
