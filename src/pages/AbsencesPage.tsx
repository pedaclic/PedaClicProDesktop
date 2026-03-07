/**
 * PedaClic Pro Desktop — AbsencesPage.tsx
 * Suivi quotidien des absences par classe
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getAbsencesClasse, getAbsencesAujourdhui,
  createAbsence, justifierAbsence, deleteAbsence,
  getStatsAbsencesEleve, saisirAbsencesMasse,
} from '../db/absencesService';
import { getClasses } from '../db/classesService';
import { getElevesParClasse } from '../db/elevesService';
import type { Classe, Eleve, Absence } from '../types';
import './AbsencesPage.css';

type Vue = 'appel' | 'historique';

export default function AbsencesPage() {
  // ── États principaux ───────────────────────────────────
  const [classes, setClasses]           = useState<Classe[]>([]);
  const [classeActive, setClasseActive] = useState<Classe | null>(null);
  const [eleves, setEleves]             = useState<Eleve[]>([]);
  const [vue, setVue]                   = useState<Vue>('appel');
  const [isLoading, setIsLoading]       = useState(false);
  const [dateFiltre, setDateFiltre]     = useState(
    new Date().toISOString().split('T')[0]
  );

  // ── États appel du jour ────────────────────────────────
  const [absentsIds, setAbsentsIds]     = useState<Set<number>>(new Set());
  const [heureDebut, setHeureDebut]     = useState('08:00');
  const [heureFin, setHeureFin]         = useState('10:00');
  const [isSaving, setIsSaving]         = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  // ── États historique ───────────────────────────────────
  const [absences, setAbsences]         = useState<Array<Absence & {
    eleve_nom: string; eleve_prenom: string;
  }>>([]);
  const [dateDebut, setDateDebut]       = useState('');
  const [dateFin, setDateFin]           = useState('');

  // ── Charger les classes ────────────────────────────────
  useEffect(() => {
    getClasses().then(data => {
      setClasses(data);
      if (data.length > 0) setClasseActive(data[0]);
    });
  }, []);

  // ── Charger les élèves quand classe change ─────────────
  const chargerEleves = useCallback(async () => {
    if (!classeActive) return;
    setIsLoading(true);
    try {
      const data = await getElevesParClasse(classeActive.id);
      setEleves(data);
      setAbsentsIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [classeActive]);

  useEffect(() => { chargerEleves(); }, [chargerEleves]);

  // ── Charger l'historique ───────────────────────────────
  const chargerHistorique = useCallback(async () => {
    if (!classeActive) return;
    setIsLoading(true);
    try {
      const data = await getAbsencesClasse(
        classeActive.id,
        dateDebut || undefined,
        dateFin   || undefined
      );
      setAbsences(data);
    } finally {
      setIsLoading(false);
    }
  }, [classeActive, dateDebut, dateFin]);

  useEffect(() => {
    if (vue === 'historique') chargerHistorique();
  }, [vue, chargerHistorique]);

  // ── Cocher/décocher un élève absent ───────────────────
  const toggleAbsent = (eleveId: number) => {
    setAbsentsIds(prev => {
      const next = new Set(prev);
      if (next.has(eleveId)) next.delete(eleveId);
      else next.add(eleveId);
      return next;
    });
  };

  // ── Enregistrer l'appel ────────────────────────────────
  const handleEnregistrerAppel = async () => {
    if (!classeActive) return;
    if (absentsIds.size === 0) {
      setSaveMsg('✅ Tous les élèves sont présents — aucune absence enregistrée');
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    setIsSaving(true);
    try {
      await saisirAbsencesMasse(
        dateFiltre,
        Array.from(absentsIds).map(id => ({
          eleve_id: id,
          heure_debut: heureDebut,
          heure_fin: heureFin,
        }))
      );
      setSaveMsg(`✅ ${absentsIds.size} absence(s) enregistrée(s)`);
      setAbsentsIds(new Set());
    } catch (err) {
      setSaveMsg('❌ ' + (err as Error).message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  // ── Justifier une absence ──────────────────────────────
  const handleJustifier = async (id: number) => {
    await justifierAbsence(id);
    chargerHistorique();
  };

  // ── Supprimer une absence ──────────────────────────────
  const handleSupprimer = async (id: number) => {
    if (!confirm('Supprimer cette absence ?')) return;
    await deleteAbsence(id);
    chargerHistorique();
  };

  // ── Formater la date en français ──────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="absences-page">

      {/* ── En-tête ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Absences</h1>
          <p className="page-subtitle">
            {classeActive ? classeActive.nom : 'Sélectionnez une classe'}
          </p>
        </div>
        <div className="page-header__right">
          <div className="vue-btns">
            <button
              className={`vue-btn ${vue === 'appel' ? 'vue-btn--active' : ''}`}
              onClick={() => setVue('appel')}
            >📋 Appel du jour</button>
            <button
              className={`vue-btn ${vue === 'historique' ? 'vue-btn--active' : ''}`}
              onClick={() => setVue('historique')}
            >📅 Historique</button>
          </div>
        </div>
      </div>

      {/* ── Tabs classes ── */}
      {classes.length > 0 && (
        <div className="classe-tabs" style={{ marginBottom: 20 }}>
          {classes.map(c => (
            <button key={c.id}
              className={`classe-tab ${classeActive?.id === c.id ? 'classe-tab--active' : ''}`}
              onClick={() => setClasseActive(c)}
            >
              {c.nom}
            </button>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VUE APPEL DU JOUR
      ════════════════════════════════════════════════ */}
      {vue === 'appel' && classeActive && (
        <div className="appel-wrap">

          {/* Paramètres de la séance */}
          <div className="appel-params">
            <div className="form-field">
              <label className="form-label">Date</label>
              <input className="form-input" type="date"
                value={dateFiltre}
                onChange={e => setDateFiltre(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Heure début</label>
              <input className="form-input" type="time"
                value={heureDebut}
                onChange={e => setHeureDebut(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Heure fin</label>
              <input className="form-input" type="time"
                value={heureFin}
                onChange={e => setHeureFin(e.target.value)} />
            </div>
          </div>

          {/* Résumé */}
          <div className="appel-resume">
            <span>📋 {eleves.length} élèves · </span>
            <span className="text-success">✅ {eleves.length - absentsIds.size} présents</span>
            <span> · </span>
            <span className="text-danger">❌ {absentsIds.size} absents</span>
          </div>

          {/* Liste d'appel */}
          {isLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : eleves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">👨‍🎓</div>
              <h3>Aucun élève dans cette classe</h3>
            </div>
          ) : (
            <div className="appel-liste-wrap">
              <div className="appel-actions">
                <button className="btn-secondary btn-sm"
                  onClick={() => setAbsentsIds(new Set(eleves.map(e => e.id)))}>
                  Tous absents
                </button>
                <button className="btn-secondary btn-sm"
                  onClick={() => setAbsentsIds(new Set())}>
                  Tous présents
                </button>
                <div style={{ flex: 1 }} />
                {saveMsg && <span className="save-msg">{saveMsg}</span>}
                <button className="btn-primary btn-sm"
                  onClick={handleEnregistrerAppel} disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : '💾 Enregistrer l\'appel'}
                </button>
              </div>

              <div className="appel-grid">
                {eleves.map((eleve, index) => {
                  const absent = absentsIds.has(eleve.id);
                  return (
                    <div
                      key={eleve.id}
                      className={`appel-card ${absent ? 'appel-card--absent' : 'appel-card--present'}`}
                      onClick={() => toggleAbsent(eleve.id)}
                    >
                      <div className="appel-card__num">{index + 1}</div>
                      <div className="appel-card__avatar">
                        {eleve.prenom[0]}{eleve.nom[0]}
                      </div>
                      <div className="appel-card__nom">
                        <div>{eleve.nom}</div>
                        <div className="appel-card__prenom">{eleve.prenom}</div>
                      </div>
                      <div className="appel-card__status">
                        {absent ? '❌' : '✅'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VUE HISTORIQUE
      ════════════════════════════════════════════════ */}
      {vue === 'historique' && classeActive && (
        <div className="historique-wrap">

          {/* Filtres date */}
          <div className="historique-filtres">
            <div className="form-field">
              <label className="form-label">Du</label>
              <input className="form-input" type="date"
                value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Au</label>
              <input className="form-input" type="date"
                value={dateFin} onChange={e => setDateFin(e.target.value)} />
            </div>
            <button className="btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}
              onClick={chargerHistorique}>
              Filtrer
            </button>
          </div>

          {/* Tableau historique */}
          {isLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : absences.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📅</div>
              <h3>Aucune absence enregistrée</h3>
              <p>Utilisez l'appel du jour pour enregistrer des absences</p>
            </div>
          ) : (
            <div className="historique-table-wrap">
              <table className="eleves-table">
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Date</th>
                    <th>Horaire</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map(a => (
                    <tr key={a.id}>
                      <td className="td-nom">
                        <div className="eleve-avatar">
                          {a.eleve_prenom[0]}{a.eleve_nom[0]}
                        </div>
                        <span className="eleve-nom">{a.eleve_nom} {a.eleve_prenom}</span>
                      </td>
                      <td>{formatDate(a.date_absence)}</td>
                      <td>
                        {a.heure_debut && a.heure_fin
                          ? `${a.heure_debut} – ${a.heure_fin}`
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>{a.motif ?? <span className="text-muted">—</span>}</td>
                      <td>
                        <span className={`statut-badge ${a.justifiee ? 'statut-badge--ok' : 'statut-badge--warn'}`}>
                          {a.justifiee ? '✅ Justifiée' : '⚠️ Non justifiée'}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          {!a.justifiee && (
                            <button className="btn-icon btn-icon--edit"
                              onClick={() => handleJustifier(a.id)}
                              title="Marquer comme justifiée">✅</button>
                          )}
                          <button className="btn-icon btn-icon--delete"
                            onClick={() => handleSupprimer(a.id)}
                            title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}