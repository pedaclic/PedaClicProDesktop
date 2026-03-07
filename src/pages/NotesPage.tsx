/**
 * PedaClic Pro Desktop — NotesPage.tsx
 * Saisie des notes + calcul automatique des moyennes
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getNotesClasse, saisirNotesMasse, deleteNote,
  getBulletinClasse, TYPES_DEVOIRS, TRIMESTRES,
} from '../db/notesService';
import { getClasses } from '../db/classesService';
import { getElevesParClasse } from '../db/elevesService';
import { DISCIPLINES } from '../constants/disciplines';
import type { Classe, Eleve, TypeDevoir, Trimestre } from '../types';
import type { BulletinEleve } from '../db/notesService';
import './NotesPage.css';

type Vue = 'saisie' | 'bulletin';

export default function NotesPage() {
  // ── États principaux ───────────────────────────────────
  const [classes, setClasses]           = useState<Classe[]>([]);
  const [classeActive, setClasseActive] = useState<Classe | null>(null);
  const [eleves, setEleves]             = useState<Eleve[]>([]);
  const [trimestre, setTrimestre]       = useState<Trimestre>(1);
  const [vue, setVue]                   = useState<Vue>('saisie');
  const [isLoading, setIsLoading]       = useState(false);

  // ── États saisie devoir ────────────────────────────────
  const [matiere, setMatiere]           = useState('');
  const [typeDevoir, setTypeDevoir]     = useState<TypeDevoir>('Devoir');
  const [intitule, setIntitule]         = useState('');
  const [dateDevoir, setDateDevoir]     = useState(
    new Date().toISOString().split('T')[0]
  );
  const [coefficient, setCoefficient]  = useState(1);
  const [notesForm, setNotesForm]       = useState<Record<number, string>>({});
  const [isSaving, setIsSaving]         = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  // ── États bulletin ─────────────────────────────────────
  const [bulletin, setBulletin]         = useState<BulletinEleve[]>([]);

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
      // Initialiser le formulaire de notes vide
      const init: Record<number, string> = {};
      data.forEach(e => { init[e.id] = ''; });
      setNotesForm(init);
    } finally {
      setIsLoading(false);
    }
  }, [classeActive]);

  useEffect(() => { chargerEleves(); }, [chargerEleves]);

  // ── Charger le bulletin ────────────────────────────────
  const chargerBulletin = useCallback(async () => {
    if (!classeActive) return;
    setIsLoading(true);
    try {
      const data = await getBulletinClasse(classeActive.id, trimestre);
      setBulletin(data);
    } finally {
      setIsLoading(false);
    }
  }, [classeActive, trimestre]);

  useEffect(() => {
    if (vue === 'bulletin') chargerBulletin();
  }, [vue, chargerBulletin]);

  // ── Sauvegarder les notes ──────────────────────────────
  const handleSauvegarder = async () => {
    if (!matiere.trim()) { setSaveMsg('⚠️ Entrez le nom de la matière'); return; }
    if (!classeActive) return;

    const notesValides = Object.entries(notesForm)
      .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
      .map(([id, v]) => ({ eleve_id: parseInt(id), note: parseFloat(v) }));

    if (notesValides.length === 0) { setSaveMsg('⚠️ Aucune note saisie'); return; }

    setIsSaving(true);
    setSaveMsg('');
    try {
      await saisirNotesMasse(
        { matiere, type_devoir: typeDevoir, intitule, date_devoir: dateDevoir, trimestre, coefficient },
        notesValides
      );
      setSaveMsg(`✅ ${notesValides.length} note(s) enregistrée(s)`);
      // Réinitialiser le formulaire
      const init: Record<number, string> = {};
      eleves.forEach(e => { init[e.id] = ''; });
      setNotesForm(init);
      setIntitule('');
    } catch (err) {
      setSaveMsg('❌ Erreur : ' + (err as Error).message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  // ── Couleur selon la note ──────────────────────────────
  const couleurNote = (note: number | null): string => {
    if (note === null) return '#94a3b8';
    if (note >= 14) return '#16a34a';
    if (note >= 10) return '#2563eb';
    if (note >= 8)  return '#ca8a04';
    return '#dc2626';
  };

  return (
    <div className="notes-page">

      {/* ── En-tête ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Notes et moyennes</h1>
          <p className="page-subtitle">
            {classeActive ? `${classeActive.nom} · Trimestre ${trimestre}` : 'Sélectionnez une classe'}
          </p>
        </div>
        <div className="page-header__right">
          {/* Sélecteur trimestre */}
          <div className="trimestre-btns">
            {TRIMESTRES.map(t => (
              <button key={t}
                className={`trimestre-btn ${trimestre === t ? 'trimestre-btn--active' : ''}`}
                onClick={() => setTrimestre(t)}
              >
                T{t}
              </button>
            ))}
          </div>
          {/* Basculer vue */}
          <div className="vue-btns">
            <button
              className={`vue-btn ${vue === 'saisie' ? 'vue-btn--active' : ''}`}
              onClick={() => setVue('saisie')}
            >✏️ Saisie</button>
            <button
              className={`vue-btn ${vue === 'bulletin' ? 'vue-btn--active' : ''}`}
              onClick={() => setVue('bulletin')}
            >📊 Bulletin</button>
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
          VUE SAISIE
      ════════════════════════════════════════════════ */}
      {vue === 'saisie' && classeActive && (
        <div className="notes-saisie">

          {/* Paramètres du devoir */}
          <div className="devoir-params">
            <h3 className="devoir-params__title">Paramètres du devoir</h3>
            <div className="devoir-params__grid">

              {/* Matière */}
              <div className="form-field">
                <label className="form-label">Matière *</label>
                <input
                  className="form-input" list="matieres-list"
                  value={matiere} onChange={e => setMatiere(e.target.value)}
                  placeholder="Ex: Mathématiques"
                />
                <datalist id="matieres-list">
                  {DISCIPLINES.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              {/* Type de devoir */}
              <div className="form-field">
                <label className="form-label">Type</label>
                <div className="type-btns">
                  {TYPES_DEVOIRS.map(t => (
                    <button key={t} type="button"
                      className={`type-btn ${typeDevoir === t ? 'type-btn--active' : ''}`}
                      onClick={() => setTypeDevoir(t)}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Intitulé */}
              <div className="form-field">
                <label className="form-label">Intitulé (optionnel)</label>
                <input className="form-input" value={intitule}
                  onChange={e => setIntitule(e.target.value)}
                  placeholder="Ex: Devoir n°1 — Fractions" />
              </div>

              {/* Date + Coefficient */}
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date"
                    value={dateDevoir} onChange={e => setDateDevoir(e.target.value)} />
                </div>
                <div className="form-field">
                  <label className="form-label">Coefficient</label>
                  <input className="form-input" type="number" min="0.5" max="5" step="0.5"
                    value={coefficient} onChange={e => setCoefficient(parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* Grille de saisie des notes */}
          {isLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : eleves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">👨‍🎓</div>
              <h3>Aucun élève dans cette classe</h3>
            </div>
          ) : (
            <div className="notes-grid-wrap">
              <div className="notes-grid-header">
                <span>{eleves.length} élèves</span>
                <div className="notes-grid-actions">
                  {saveMsg && <span className="save-msg">{saveMsg}</span>}
                  <button className="btn-secondary btn-sm"
                    onClick={() => {
                      const init: Record<number, string> = {};
                      eleves.forEach(e => { init[e.id] = ''; });
                      setNotesForm(init);
                    }}>
                    Effacer
                  </button>
                  <button className="btn-primary btn-sm"
                    onClick={handleSauvegarder} disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : '💾 Enregistrer'}
                  </button>
                </div>
              </div>

              <table className="notes-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Élève</th>
                    <th className="th-note">Note /20</th>
                    <th>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((eleve, index) => {
                    const val = notesForm[eleve.id] ?? '';
                    const num = parseFloat(val);
                    const valid = val !== '' && !isNaN(num) && num >= 0 && num <= 20;
                    return (
                      <tr key={eleve.id}>
                        <td className="td-num">{index + 1}</td>
                        <td className="td-nom">
                          <div className="eleve-avatar">
                            {eleve.prenom[0]}{eleve.nom[0]}
                          </div>
                          <span className="eleve-nom">{eleve.nom} {eleve.prenom}</span>
                        </td>
                        <td className="td-note-input">
                          <input
                            className={`note-input ${valid ? 'note-input--valid' : ''}`}
                            type="number" min="0" max="20" step="0.25"
                            placeholder="—"
                            value={val}
                            onChange={e => setNotesForm(p => ({ ...p, [eleve.id]: e.target.value }))}
                          />
                        </td>
                        <td>
                          {valid && (
                            <span className="appreciation" style={{ color: couleurNote(num) }}>
                              {num >= 16 ? 'Très bien' : num >= 14 ? 'Bien' :
                               num >= 12 ? 'Assez bien' : num >= 10 ? 'Passable' :
                               num >= 8  ? 'Insuffisant' : 'Médiocre'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          VUE BULLETIN
      ════════════════════════════════════════════════ */}
      {vue === 'bulletin' && classeActive && (
        <div className="bulletin-wrap">
          {isLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : bulletin.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📊</div>
              <h3>Aucune note pour le trimestre {trimestre}</h3>
              <p>Saisissez des notes dans la vue "Saisie" pour voir le bulletin</p>
            </div>
          ) : (
            <table className="bulletin-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Élève</th>
                  {bulletin[0] && Object.keys(bulletin[0].moyennes_matieres).map(m => (
                    <th key={m} className="th-matiere">{m}</th>
                  ))}
                  <th>Moy. Gén.</th>
                </tr>
              </thead>
              <tbody>
                {bulletin.map(b => (
                  <tr key={b.eleve_id}>
                    <td className="td-rang">
                      <span className={`rang-badge ${b.rang <= 3 ? 'rang-badge--top' : ''}`}>
                        {b.rang}
                      </span>
                    </td>
                    <td className="td-nom">
                      <div className="eleve-avatar">{b.eleve_prenom[0]}{b.eleve_nom[0]}</div>
                      <span className="eleve-nom">{b.eleve_nom} {b.eleve_prenom}</span>
                    </td>
                    {Object.entries(b.moyennes_matieres).map(([m, moy]) => (
                      <td key={m} className="td-moy"
                        style={{ color: couleurNote(moy), fontWeight: 600 }}>
                        {moy !== null ? moy.toFixed(2) : '—'}
                      </td>
                    ))}
                    <td className="td-moy-gen"
                      style={{ color: couleurNote(b.moyenne_generale), fontWeight: 700 }}>
                      {b.moyenne_generale !== null ? b.moyenne_generale.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}