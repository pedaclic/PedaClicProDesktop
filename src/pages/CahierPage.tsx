/**
 * PedaClic Pro Desktop — CahierPage.tsx
 * Cahier de textes numérique par classe et matière
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getCahiers, createCahier, deleteCahier,
  getEntreesCahier, createEntree, updateEntree, deleteEntree,
  getSequences,
} from '../db/cahierService';
import { getClasses, getAnneeScolaireCourante, NIVEAUX_LABELS } from '../db/classesService';
import { DISCIPLINES } from '../constants/disciplines';
import type { Classe, CahierTextes, EntreeCahier, Sequence } from '../types';
import './CahierPage.css';

interface CahierAvecMeta extends CahierTextes {
  classe_nom: string;
  nb_entrees: number;
}
type Vue = 'cahiers' | 'entrees';

const FORM_ENTREE_VIDE = {
  titre: '',
  date_seance: new Date().toISOString().split('T')[0],
  contenu: '',
  devoirs: '',
  sequence_id: '',
};

export default function CahierPage() {
  const [anneeFiltre] = useState(getAnneeScolaireCourante());
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActive, setClasseActive] = useState<Classe | null>(null);
  const [cahiers, setCahiers] = useState<CahierAvecMeta[]>([]);
  const [cahierActif, setCahierActif] = useState<CahierAvecMeta | null>(null);
  const [entrees, setEntrees] = useState<EntreeCahier[]>([]);
  const [vue, setVue] = useState<Vue>('cahiers');
  const [isLoading, setIsLoading] = useState(true);
  const [matiereNouveau, setMatiereNouveau] = useState('');
  const [showFormEntree, setShowFormEntree] = useState(false);
  const [formEntree, setFormEntree] = useState(FORM_ENTREE_VIDE);
  const [entreeEdit, setEntreeEdit] = useState<EntreeCahier | null>(null);
  const [entreeOuverte, setEntreeOuverte] = useState<number | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);

  const chargerClasses = useCallback(async () => {
    try {
      const data = await getClasses(anneeFiltre);
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  }, [anneeFiltre]);

  const chargerCahiers = useCallback(async () => {
    if (!classeActive) return;
    setIsLoading(true);
    try {
      const data = await getCahiers(classeActive.id);
      setCahiers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [classeActive]);

  const chargerEntrees = useCallback(async () => {
    if (!cahierActif) return;
    try {
      const data = await getEntreesCahier(cahierActif.id);
      setEntrees(data);
    } catch (err) {
      console.error(err);
    }
  }, [cahierActif]);

  const chargerSequences = useCallback(async () => {
    try {
      const data = await getSequences();
      setSequences(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { chargerClasses(); }, [chargerClasses]);
  useEffect(() => { chargerCahiers(); }, [chargerCahiers]);
  useEffect(() => { chargerEntrees(); }, [chargerEntrees]);
  useEffect(() => { chargerSequences(); }, [chargerSequences]);

  const handleCreerCahier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classeActive || !matiereNouveau.trim()) return;
    try {
      const annee = new Date().getMonth() >= 9
        ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
      await createCahier({ classe_id: classeActive.id, matiere: matiereNouveau.trim(), annee });
      setMatiereNouveau('');
      chargerCahiers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSupprimerCahier = async (id: number) => {
    if (!confirm('Supprimer ce cahier et toutes ses entrées ?')) return;
    try {
      await deleteCahier(id);
      if (cahierActif?.id === id) {
        setCahierActif(null);
        setVue('cahiers');
      }
      chargerCahiers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const ouvrirEntrees = (c: CahierAvecMeta) => {
    setCahierActif(c);
    setVue('entrees');
  };

  const ouvrirFormEntree = (entree?: EntreeCahier) => {
    if (entree) {
      setEntreeEdit(entree);
      setFormEntree({
        titre: entree.titre,
        date_seance: entree.date_seance,
        contenu: entree.contenu ?? '',
        devoirs: entree.devoirs ?? '',
        sequence_id: entree.sequence_id ? String(entree.sequence_id) : '',
      });
    } else {
      setEntreeEdit(null);
      setFormEntree({ ...FORM_ENTREE_VIDE, date_seance: new Date().toISOString().split('T')[0] });
    }
    setShowFormEntree(true);
  };

  const handleSoumettreEntree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cahierActif || !formEntree.titre.trim()) return;
    try {
      if (entreeEdit) {
        await updateEntree(entreeEdit.id, {
          titre: formEntree.titre,
          date_seance: formEntree.date_seance,
          contenu: formEntree.contenu || undefined,
          devoirs: formEntree.devoirs || undefined,
        });
      } else {
        await createEntree({
          cahier_id: cahierActif.id,
          titre: formEntree.titre,
          date_seance: formEntree.date_seance,
          contenu: formEntree.contenu || undefined,
          devoirs: formEntree.devoirs || undefined,
          sequence_id: formEntree.sequence_id ? parseInt(formEntree.sequence_id, 10) : undefined,
        });
      }
      setShowFormEntree(false);
      chargerEntrees();
      chargerCahiers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSupprimerEntree = async (id: number) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    try {
      await deleteEntree(id);
      setEntreeOuverte(null);
      chargerEntrees();
      chargerCahiers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="cahier-page">
      {!classeActive ? (
        <div>
          <h2 style={{ marginBottom: 16 }}>Choisir une classe</h2>
          <div className="cahiers-grid">
            {classes.map(c => (
              <div
                key={c.id}
                className="cahier-card"
                onClick={() => setClasseActive(c)}
              >
                <span className="cahier-card__icon">📚</span>
                <div className="cahier-card__body">
                  <div className="cahier-card__matiere">{c.nom}</div>
                  <div className="cahier-card__meta">{NIVEAUX_LABELS[c.niveau] ?? c.niveau} · {c.annee} · {c.effectif} élève(s)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : vue === 'cahiers' ? (
        <div>
          <button type="button" className="btn-back" onClick={() => setClasseActive(null)}>
            ← Retour aux classes
          </button>
          <h2 style={{ marginBottom: 16 }}>Cahiers — {classeActive.nom}</h2>

          <form onSubmit={handleCreerCahier} style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
            <input
              type="text"
              list="matieres-cahier"
              value={matiereNouveau}
              onChange={e => setMatiereNouveau(e.target.value)}
              placeholder="Nouvelle matière (ex: Mathématiques)"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)' }}
            />
            <datalist id="matieres-cahier">
              {DISCIPLINES.map(d => <option key={d} value={d} />)}
            </datalist>
            <button type="submit" style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Créer
            </button>
          </form>

          {isLoading ? (
            <p className="text-muted">Chargement...</p>
          ) : (
            <div className="cahiers-grid">
              {cahiers.map(c => (
                <div key={c.id} className="cahier-card" onClick={() => ouvrirEntrees(c)}>
                  <button
                    type="button"
                    className="cahier-card__delete"
                    onClick={e => { e.stopPropagation(); handleSupprimerCahier(c.id); }}
                    aria-label="Supprimer"
                  >
                    🗑️
                  </button>
                  <span className="cahier-card__icon">📔</span>
                  <div className="cahier-card__body">
                    <div className="cahier-card__matiere">{c.matiere}</div>
                    <div className="cahier-card__meta">{c.classe_nom} · {c.annee}</div>
                    <span className="cahier-card__badge">{c.nb_entrees} entrée(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : cahierActif && (
        <div>
          <button type="button" className="btn-back" onClick={() => { setVue('cahiers'); setCahierActif(null); }}>
            ← Retour aux cahiers
          </button>
          <h2 style={{ marginBottom: 16 }}>{cahierActif.matiere} — {cahierActif.classe_nom}</h2>

          <button
            type="button"
            onClick={() => ouvrirFormEntree()}
            style={{ marginBottom: 16, padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            + Nouvelle entrée
          </button>

          {showFormEntree && (
            <form onSubmit={handleSoumettreEntree} style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <div className="form-field">
                  <label>Titre *</label>
                  <input
                    value={formEntree.titre}
                    onChange={e => setFormEntree(f => ({ ...f, titre: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)' }}
                  />
                </div>
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formEntree.date_seance}
                    onChange={e => setFormEntree(f => ({ ...f, date_seance: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)' }}
                  />
                </div>
              </div>
              <div className="entree-section" style={{ marginBottom: 12 }}>
                <label className="entree-section__label">Contenu</label>
                <textarea
                  className="form-textarea"
                  value={formEntree.contenu}
                  onChange={e => setFormEntree(f => ({ ...f, contenu: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="entree-section" style={{ marginBottom: 12 }}>
                <label className="entree-section__label">Devoirs</label>
                <textarea
                  className="form-textarea"
                  value={formEntree.devoirs}
                  onChange={e => setFormEntree(f => ({ ...f, devoirs: e.target.value }))}
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">{entreeEdit ? 'Modifier' : 'Créer'}</button>
                <button type="button" onClick={() => setShowFormEntree(false)}>Annuler</button>
              </div>
            </form>
          )}

          <div className="entrees-list">
            {entrees.map(e => (
              <div key={e.id} className={`entree-card ${entreeOuverte === e.id ? 'entree-card--open' : ''}`}>
                <div
                  className="entree-card__header"
                  onClick={() => setEntreeOuverte(entreeOuverte === e.id ? null : e.id)}
                >
                  <div className="entree-card__date-badge">{e.date_seance}</div>
                  <div className="entree-card__info">
                    <div className="entree-card__titre">{e.titre}</div>
                    <div className="entree-card__meta">{e.contenu ? `${e.contenu.slice(0, 60)}...` : '—'}</div>
                  </div>
                  <div className="entree-card__actions">
                    <button type="button" onClick={ev => { ev.stopPropagation(); ouvrirFormEntree(e); }}>✏️</button>
                    <button type="button" onClick={ev => { ev.stopPropagation(); handleSupprimerEntree(e.id); }}>🗑️</button>
                  </div>
                  <span className="entree-card__chevron">{entreeOuverte === e.id ? '▲' : '▼'}</span>
                </div>
                {entreeOuverte === e.id && (
                  <div className="entree-card__body">
                    {e.contenu && (
                      <div className="entree-section">
                        <div className="entree-section__label">Contenu</div>
                        <div className="entree-section__text">{e.contenu}</div>
                      </div>
                    )}
                    {e.devoirs && (
                      <div className="entree-section entree-section--devoirs">
                        <div className="entree-section__label">Devoirs</div>
                        <div className="entree-section__text">{e.devoirs}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
