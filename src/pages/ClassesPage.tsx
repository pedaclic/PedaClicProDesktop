/**
 * PedaClic Pro Desktop — ClassesPage.tsx
 * Gestion complète des classes (liste, création, modification, suppression)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getClasses, createClasse, updateClasse, deleteClasse,
  getAnneeScolaireCourante, getAnneesDisponibles,
  NIVEAUX, NIVEAUX_LABELS,
} from '../db/classesService';
import type { Classe, NiveauScolaire } from '../types';
import './ClassesPage.css';

// ── Formulaire vide par défaut ─────────────────────────────
const FORM_VIDE = { nom: '', niveau: '6eme' as NiveauScolaire, annee: getAnneeScolaireCourante() };

export default function ClassesPage() {
  const [classes, setClasses]         = useState<Classe[]>([]);
  const [annees, setAnnees]           = useState<string[]>([]);
  const [anneeFiltre, setAnneeFiltre] = useState(getAnneeScolaireCourante());
  const [isLoading, setIsLoading]     = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Classe | null>(null);
  const [form, setForm]               = useState(FORM_VIDE);
  const [isSaving, setIsSaving]       = useState(false);
  const [error, setError]             = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Classe | null>(null);

  // ── Charger les classes ──────────────────────────────────
  const chargerClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, anneesData] = await Promise.all([
        getClasses(anneeFiltre),
        getAnneesDisponibles(),
      ]);
      setClasses(data);
      // Ajouter l'année courante si pas encore dans la liste
      const toutesAnnees = anneesData.includes(anneeFiltre)
        ? anneesData
        : [anneeFiltre, ...anneesData];
      setAnnees(toutesAnnees);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [anneeFiltre]);

  useEffect(() => { chargerClasses(); }, [chargerClasses]);

  // ── Ouvrir le modal création ───────────────────────────
  const ouvrirCreation = () => {
    setEditTarget(null);
    setForm({ ...FORM_VIDE, annee: anneeFiltre });
    setError('');
    setShowModal(true);
  };

  // ── Ouvrir le modal édition ────────────────────────────
  const ouvrirEdition = (classe: Classe) => {
    setEditTarget(classe);
    setForm({ nom: classe.nom, niveau: classe.niveau, annee: classe.annee });
    setError('');
    setShowModal(true);
  };

  // ── Soumettre le formulaire ────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) { setError('Le nom de la classe est obligatoire'); return; }
    setIsSaving(true);
    setError('');
    try {
      if (editTarget) {
        await updateClasse(editTarget.id, form);
      } else {
        await createClasse(form);
      }
      setShowModal(false);
      chargerClasses();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Supprimer une classe ───────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteClasse(deleteConfirm.id);
      setDeleteConfirm(null);
      chargerClasses();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Couleur par niveau ─────────────────────────────────
  const couleurNiveau = (niveau: NiveauScolaire): string => {
    const map: Record<NiveauScolaire, string> = {
      '6eme': '#3b82f6', '5eme': '#8b5cf6', '4eme': '#ec4899',
      '3eme': '#f59e0b', '2nde': '#10b981', '1ere': '#ef4444', 'Tle': '#6366f1',
    };
    return map[niveau] ?? '#64748b';
  };

  return (
    <div className="classes-page">

      {/* ── En-tête ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Mes Classes</h1>
          <p className="page-subtitle">{classes.length} classe{classes.length !== 1 ? 's' : ''} — {anneeFiltre}</p>
        </div>
        <div className="page-header__right">
          {/* Filtre par année scolaire */}
          <select
            className="select-annee"
            value={anneeFiltre}
            onChange={e => setAnneeFiltre(e.target.value)}
          >
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-primary" onClick={ouvrirCreation}>
            + Nouvelle classe
          </button>
        </div>
      </div>

      {/* ── Contenu ── */}
      {isLoading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📚</div>
          <h3>Aucune classe pour {anneeFiltre}</h3>
          <p>Créez votre première classe pour commencer</p>
          <button className="btn-primary" onClick={ouvrirCreation}>
            + Créer une classe
          </button>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map(classe => (
            <div key={classe.id} className="classe-card">
              {/* Bandeau couleur niveau */}
              <div
                className="classe-card__banner"
                style={{ background: couleurNiveau(classe.niveau) }}
              />
              <div className="classe-card__body">
                <div className="classe-card__niveau" style={{ color: couleurNiveau(classe.niveau) }}>
                  {NIVEAUX_LABELS[classe.niveau]}
                </div>
                <h2 className="classe-card__nom">{classe.nom}</h2>
                <div className="classe-card__stats">
                  <span className="stat-badge">
                    👨‍🎓 {classe.effectif} élève{classe.effectif !== 1 ? 's' : ''}
                  </span>
                  <span className="stat-badge">{classe.annee}</span>
                </div>
              </div>
              <div className="classe-card__actions">
                <button
                  className="btn-icon btn-icon--edit"
                  onClick={() => ouvrirEdition(classe)}
                  title="Modifier"
                >✏️</button>
                <button
                  className="btn-icon btn-icon--delete"
                  onClick={() => setDeleteConfirm(classe)}
                  title="Supprimer"
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Création / Édition ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editTarget ? 'Modifier la classe' : 'Nouvelle classe'}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form className="modal__form" onSubmit={handleSubmit}>
              {/* Nom de la classe */}
              <div className="form-field">
                <label className="form-label">Nom de la classe *</label>
                <input
                  className="form-input"
                  value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: 3ème A, Terminale S2, 6ème B..."
                  required
                />
              </div>

              {/* Niveau */}
              <div className="form-field">
                <label className="form-label">Niveau *</label>
                <div className="niveau-grid">
                  {NIVEAUX.map(n => (
                    <button
                      key={n} type="button"
                      className={`niveau-btn ${form.niveau === n ? 'niveau-btn--active' : ''}`}
                      style={form.niveau === n ? { background: couleurNiveau(n), borderColor: couleurNiveau(n) } : {}}
                      onClick={() => setForm(p => ({ ...p, niveau: n }))}
                    >
                      {NIVEAUX_LABELS[n]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Année scolaire */}
              <div className="form-field">
                <label className="form-label">Année scolaire *</label>
                <input
                  className="form-input"
                  value={form.annee}
                  onChange={e => setForm(p => ({ ...p, annee: e.target.value }))}
                  placeholder="Ex: 2024-2025"
                  required
                />
              </div>

              {error && <div className="form-error">⚠️ {error}</div>}

              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : (editTarget ? 'Modifier' : 'Créer la classe')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmation Suppression ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--small" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Supprimer la classe</h2>
              <button className="modal__close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal__body">
              <p>Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm.nom}</strong> ?</p>
              <p className="text-warning">⚠️ Tous les élèves et données associés seront supprimés.</p>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={handleDelete}>Supprimer définitivement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}