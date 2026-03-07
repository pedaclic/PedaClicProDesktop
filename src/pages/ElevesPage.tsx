/**
 * PedaClic Pro Desktop — ElevesPage.tsx
 * Liste nominative des élèves par classe
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getElevesParClasse, createEleve, updateEleve,
  archiverEleve, getStatsClasse, importerEleves,
} from '../db/elevesService';
import { getClasses, NIVEAUX_LABELS } from '../db/classesService';
import type { Eleve, Classe } from '../types';
import './ElevesPage.css';

const FORM_VIDE = {
  nom: '', prenom: '', matricule: '',
  date_naissance: '', sexe: '' as '' | 'M' | 'F',
  parent_nom: '', parent_tel: '',
};

export default function ElevesPage() {
  const navigate = useNavigate();

  // ── États principaux ───────────────────────────────────
  const [classes, setClasses]         = useState<Classe[]>([]);
  const [classeActive, setClasseActive] = useState<Classe | null>(null);
  const [eleves, setEleves]           = useState<Eleve[]>([]);
  const [stats, setStats]             = useState({ total: 0, garcons: 0, filles: 0 });
  const [isLoading, setIsLoading]     = useState(false);
  const [recherche, setRecherche]     = useState('');

  // ── États modal ────────────────────────────────────────
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Eleve | null>(null);
  const [form, setForm]               = useState(FORM_VIDE);
  const [isSaving, setIsSaving]       = useState(false);
  const [error, setError]             = useState('');

  // ── Import en masse ────────────────────────────────────
  const [showImport, setShowImport]   = useState(false);
  const [importText, setImportText]   = useState('');
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  // ── Charger les classes au montage ────────────────────
  useEffect(() => {
    getClasses().then(data => {
      setClasses(data);
      if (data.length > 0) setClasseActive(data[0]);
    });
  }, []);

  // ── Charger les élèves quand la classe change ──────────
  const chargerEleves = useCallback(async () => {
    if (!classeActive) return;
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        getElevesParClasse(classeActive.id),
        getStatsClasse(classeActive.id),
      ]);
      setEleves(data);
      setStats(statsData);
    } finally {
      setIsLoading(false);
    }
  }, [classeActive]);

  useEffect(() => { chargerEleves(); }, [chargerEleves]);

  // ── Filtrer par recherche ──────────────────────────────
  const elevesFiltres = eleves.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(recherche.toLowerCase()) ||
    (e.matricule ?? '').toLowerCase().includes(recherche.toLowerCase())
  );

  // ── Ouvrir modal création ──────────────────────────────
  const ouvrirCreation = () => {
    setEditTarget(null);
    setForm(FORM_VIDE);
    setError('');
    setShowModal(true);
  };

  // ── Ouvrir modal édition ───────────────────────────────
  const ouvrirEdition = (eleve: Eleve) => {
    setEditTarget(eleve);
    setForm({
      nom: eleve.nom, prenom: eleve.prenom,
      matricule: eleve.matricule ?? '',
      date_naissance: eleve.date_naissance ?? '',
      sexe: eleve.sexe ?? '',
      parent_nom: eleve.parent_nom ?? '',
      parent_tel: eleve.parent_tel ?? '',
    });
    setError('');
    setShowModal(true);
  };

  // ── Soumettre formulaire ───────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) {
      setError('Nom et prénom sont obligatoires');
      return;
    }
    if (!classeActive) return;
    setIsSaving(true);
    setError('');
    try {
      const data = {
        nom: form.nom, prenom: form.prenom,
        matricule:      form.matricule      || undefined,
        date_naissance: form.date_naissance || undefined,
        sexe:           (form.sexe as 'M' | 'F') || undefined,
        parent_nom:     form.parent_nom     || undefined,
        parent_tel:     form.parent_tel     || undefined,
      };
      if (editTarget) {
        await updateEleve(editTarget.id, data);
      } else {
        await createEleve({ ...data, classe_id: classeActive.id });
      }
      setShowModal(false);
      chargerEleves();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Archiver un élève ──────────────────────────────────
  const handleArchiver = async (eleve: Eleve) => {
    if (!confirm(`Archiver ${eleve.prenom} ${eleve.nom} ?`)) return;
    await archiverEleve(eleve.id);
    chargerEleves();
  };

  // ── Import en masse depuis texte ───────────────────────
  // Format attendu : "NOM Prénom" ou "NOM Prénom M/F" — une ligne par élève
  const handleImport = async () => {
    if (!classeActive || !importText.trim()) return;
    const lignes = importText.trim().split('\n').filter(l => l.trim());
    const elevesAImporter = lignes.map(ligne => {
      const parts = ligne.trim().split(/\s+/);
      const sexe = ['M', 'F'].includes(parts[parts.length - 1]?.toUpperCase())
        ? parts.pop()!.toUpperCase() as 'M' | 'F'
        : undefined;
      const nom    = parts[0]?.toUpperCase() ?? '';
      const prenom = parts.slice(1).join(' ');
      return { nom, prenom, sexe };
    }).filter(e => e.nom && e.prenom);

    const result = await importerEleves(classeActive.id, elevesAImporter);
    setImportResult(result);
    chargerEleves();
  };

  // ── Champ formulaire helper ────────────────────────────
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="eleves-page">

      {/* ── En-tête ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Listes des élèves</h1>
          <p className="page-subtitle">
            {classeActive
              ? `${classeActive.nom} · ${NIVEAUX_LABELS[classeActive.niveau]} · ${stats.total} élèves`
              : 'Sélectionnez une classe'}
          </p>
        </div>
        <div className="page-header__right">
          <button className="btn-secondary" onClick={() => navigate('/classes')}>
            ← Classes
          </button>
          {classeActive && (
            <>
              <button className="btn-secondary" onClick={() => { setImportResult(null); setShowImport(true); }}>
                📋 Import liste
              </button>
              <button className="btn-primary" onClick={ouvrirCreation}>
                + Ajouter élève
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Sélecteur de classe + stats ── */}
      {classes.length > 0 && (
        <div className="eleves-toolbar">
          <div className="classe-tabs">
            {classes.map(c => (
              <button key={c.id}
                className={`classe-tab ${classeActive?.id === c.id ? 'classe-tab--active' : ''}`}
                onClick={() => setClasseActive(c)}
              >
                {c.nom}
                <span className="classe-tab__badge">{c.effectif}</span>
              </button>
            ))}
          </div>

          {classeActive && (
            <div className="stats-bar">
              <span className="stats-bar__item">👨‍🎓 {stats.garcons} garçons</span>
              <span className="stats-bar__item">👩‍🎓 {stats.filles} filles</span>
              <span className="stats-bar__item">📊 Total : {stats.total}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Barre de recherche ── */}
      {classeActive && (
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-bar__input"
            placeholder="Rechercher un élève..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          {recherche && (
            <button className="search-bar__clear" onClick={() => setRecherche('')}>✕</button>
          )}
        </div>
      )}

      {/* ── Pas de classes ── */}
      {classes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📚</div>
          <h3>Aucune classe créée</h3>
          <p>Créez d'abord une classe avant d'ajouter des élèves</p>
          <button className="btn-primary" onClick={() => navigate('/classes')}>
            Créer une classe
          </button>
        </div>
      )}

      {/* ── Liste des élèves ── */}
      {classeActive && (
        isLoading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : elevesFiltres.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👨‍🎓</div>
            <h3>{recherche ? 'Aucun résultat' : 'Aucun élève dans cette classe'}</h3>
            {!recherche && (
              <button className="btn-primary" onClick={ouvrirCreation}>
                + Ajouter le premier élève
              </button>
            )}
          </div>
        ) : (
          <div className="eleves-table-wrap">
            <table className="eleves-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom et prénom</th>
                  <th>Matricule</th>
                  <th>Sexe</th>
                  <th>Date de naissance</th>
                  <th>Parent / Tuteur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elevesFiltres.map((eleve, index) => (
                  <tr key={eleve.id}>
                    <td className="td-num">{index + 1}</td>
                    <td className="td-nom">
                      <div className="eleve-avatar">
                        {eleve.prenom[0]}{eleve.nom[0]}
                      </div>
                      <div>
                        <div className="eleve-nom">{eleve.nom} {eleve.prenom}</div>
                      </div>
                    </td>
                    <td>{eleve.matricule ?? <span className="text-muted">—</span>}</td>
                    <td>
                      {eleve.sexe === 'M' ? '👦 M' : eleve.sexe === 'F' ? '👧 F' : <span className="text-muted">—</span>}
                    </td>
                    <td>{eleve.date_naissance ?? <span className="text-muted">—</span>}</td>
                    <td>
                      {eleve.parent_nom
                        ? <div><div>{eleve.parent_nom}</div><div className="text-muted">{eleve.parent_tel}</div></div>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-icon btn-icon--edit" onClick={() => ouvrirEdition(eleve)} title="Modifier">✏️</button>
                        <button className="btn-icon btn-icon--delete" onClick={() => handleArchiver(eleve)} title="Archiver">🗄️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Modal Élève ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editTarget ? 'Modifier l\'élève' : 'Nouvel élève'}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" name="nom" value={form.nom}
                    onChange={onChange} placeholder="DIALLO" required />
                </div>
                <div className="form-field">
                  <label className="form-label">Prénom *</label>
                  <input className="form-input" name="prenom" value={form.prenom}
                    onChange={onChange} placeholder="Mamadou" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Matricule</label>
                  <input className="form-input" name="matricule" value={form.matricule}
                    onChange={onChange} placeholder="Ex: SN-2024-001" />
                </div>
                <div className="form-field">
                  <label className="form-label">Sexe</label>
                  <select className="form-input" name="sexe" value={form.sexe} onChange={onChange}>
                    <option value="">—</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Date de naissance</label>
                <input className="form-input" name="date_naissance" type="date"
                  value={form.date_naissance} onChange={onChange} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Nom parent / tuteur</label>
                  <input className="form-input" name="parent_nom" value={form.parent_nom}
                    onChange={onChange} placeholder="Ibrahima Diallo" />
                </div>
                <div className="form-field">
                  <label className="form-label">Téléphone parent</label>
                  <input className="form-input" name="parent_tel" value={form.parent_tel}
                    onChange={onChange} placeholder="77 123 45 67" />
                </div>
              </div>
              {error && <div className="form-error">⚠️ {error}</div>}
              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : (editTarget ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Import ── */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal modal--large" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>📋 Import liste de classe</h2>
              <button className="modal__close" onClick={() => setShowImport(false)}>✕</button>
            </div>
            <div className="modal__form">
              <p className="import-hint">
                Collez la liste ci-dessous — <strong>une ligne par élève</strong> :<br />
                Format : <code>NOM Prénom</code> ou <code>NOM Prénom M</code> / <code>NOM Prénom F</code>
              </p>
              <textarea
                className="import-textarea"
                placeholder={`DIALLO Mamadou M\nNDIAYE Fatou F\nBAH Ousmane\n...`}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={12}
              />
              {importResult && (
                <div className={`import-result ${importResult.errors.length ? 'import-result--warn' : 'import-result--ok'}`}>
                  ✅ {importResult.success} élève(s) importé(s)
                  {importResult.errors.length > 0 && (
                    <div className="import-errors">
                      {importResult.errors.map((e, i) => <div key={i}>⚠️ {e}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Fermer</button>
              <button className="btn-primary" onClick={handleImport}>
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}