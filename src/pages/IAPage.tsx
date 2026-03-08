/**
 * PedaClic Pro Desktop — IAPage.tsx
 * Générateur de contenus pédagogiques via Claude API
 */
import React, { useState, useEffect } from 'react';
import { getClasses } from '../db/classesService';
import { getCahiers, createCahier, createEntree } from '../db/cahierService';
import { DISCIPLINES } from '../constants/disciplines';
import type { Classe } from '../types';
import './IAPage.css';

// ── Types de contenu ───────────────────────────────────────
type TypeContenu = 'fiche_cours' | 'exercices' | 'sequence' | 'devoir' | 'quiz_avance';

interface TypeContenuConfig {
  id: TypeContenu;
  label: string;
  icon: string;
  description: string;
  promptHint: string;
}

const TYPES_CONTENU: TypeContenuConfig[] = [
  {
    id: 'fiche_cours',
    label: 'Fiche de cours',
    icon: '📖',
    description: 'Cours structuré avec définitions, exemples et résumé',
    promptHint: 'Ex: Les fractions — addition et soustraction',
  },
  {
    id: 'exercices',
    label: 'Série d\'exercices',
    icon: '✏️',
    description: 'Exercices progressifs avec corrigés',
    promptHint: 'Ex: Exercices sur la conjugaison du passé composé',
  },
  {
    id: 'quiz_avance',
    label: 'Quiz Avancé',
    icon: '🎯',
    description: 'Quiz évaluatif avec QCM, Vrai/Faux et questions ouvertes',
    promptHint: 'Ex: Quiz sur les verbes irréguliers en anglais',
  },
  {
    id: 'sequence',
    label: 'Séquence pédagogique',
    icon: '📋',
    description: 'Séquence complète avec objectifs, séances et évaluations',
    promptHint: 'Ex: Séquence sur la photosynthèse — 4 séances',
  },
  {
    id: 'devoir',
    label: 'Devoir / Composition',
    icon: '📝',
    description: 'Sujet de devoir ou composition avec barème',
    promptHint: 'Ex: Composition d\'Histoire sur la colonisation',
  },
];

// ── Niveaux ────────────────────────────────────────────────
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];

// ── Formulaire par défaut ──────────────────────────────────
const FORM_VIDE = {
  type: 'fiche_cours' as TypeContenu,
  matiere: '',
  niveau: '',
  sujet: '',
  details: '',
  duree: '1h',
  nbExercices: '5',
  nbSeances: '3',
};

export default function IAPage() {
  const [classes, setClasses]           = useState<Classe[]>([]);
  const [form, setForm]                 = useState(FORM_VIDE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contenuGenere, setContenuGenere] = useState('');
  const [error, setError]               = useState('');
  const [saveMsg, setSaveMsg]           = useState('');

  // ── Sauvegarde dans cahier ─────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cahiers, setCahiers]           = useState<Array<{ id: number; matiere: string; classe_nom: string; classe_id: number }>>([]);
  const [cahierCible, setCahierCible]   = useState('');
  const [classeNouveauCahier, setClasseNouveauCahier] = useState('');
  const [titreSauvegarde, setTitreSauvegarde] = useState('');
  const [isSaving, setIsSaving]         = useState(false);

  useEffect(() => {
    getClasses().then(setClasses);
  }, []);

  // ── Construire le prompt selon le type ─────────────────
  const construirePrompt = (): string => {
    const base = `Tu es un professeur expert au Sénégal. 
Niveau : ${form.niveau || 'non précisé'}
Matière : ${form.matiere || 'non précisée'}
Sujet : ${form.sujet}
${form.details ? `Précisions : ${form.details}` : ''}

Réponds en français. Utilise le programme scolaire sénégalais (FASTEF/INEADE).
Sois clair, structuré et adapté au niveau indiqué.`;

    switch (form.type) {
      case 'fiche_cours':
        return `${base}

Génère une FICHE DE COURS complète avec :
1. 🎯 Objectifs pédagogiques (3-5 objectifs)
2. 📚 Prérequis
3. 📖 Cours structuré (introduction, développement avec titres, exemples concrets)
4. 💡 Points clés à retenir
5. 📝 Résumé (5-8 lignes)
Durée estimée : ${form.duree}`;

      case 'exercices':
        return `${base}

Génère une SÉRIE DE ${form.nbExercices} EXERCICES progressifs avec :
- Exercices numérotés du plus simple au plus difficile
- Énoncés clairs et précis
- ✅ CORRIGÉ DÉTAILLÉ pour chaque exercice
- Niveau de difficulté indiqué (★ facile, ★★ moyen, ★★★ difficile)`;

      case 'sequence':
        return `${base}

Génère une SÉQUENCE PÉDAGOGIQUE COMPLÈTE sur ${form.nbSeances} séances :
1. 🎯 Compétences visées
2. 📅 Plan des séances (titre, durée, activités, supports)
3. 📊 Évaluation diagnostique
4. 🔍 Activités différenciées
5. 📝 Évaluation sommative avec critères de réussite`;

      case 'quiz_avance':
        return `${base}

Génère un QUIZ AVANCÉ évaluatif avec :
1. 🎯 Objectifs et compétences ciblées
2. ❓ Questions variées : QCM (4 choix), Vrai/Faux, questions à réponse courte
3. 📊 Barème par question (total 20 points)
4. ✅ Corrigé détaillé avec explications
5. 📝 Grille de notation pour l'enseignant
Nombre de questions : ${form.nbExercices || '5'}`;

      case 'devoir':
        return `${base}

Génère un SUJET DE DEVOIR/COMPOSITION avec :
1. 📋 En-tête (classe, matière, durée, coefficient)
2. 📖 Texte support ou contexte (si nécessaire)
3. ❓ Questions numérotées avec points attribués
4. 📊 Barème détaillé (total : 20 points)
5. ✅ Éléments de correction attendus`;

      default:
        return base;
    }
  };

  // ── Générer le contenu ─────────────────────────────────
  const handleGenerer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sujet.trim()) { setError('Le sujet est obligatoire'); return; }

    setIsGenerating(true);
    setError('');
    setContenuGenere('');
    setSaveMsg('');

    try {
      if (typeof window.electronAPI?.aiGenerate !== 'function') {
        throw new Error('Générateur IA non disponible');
      }

      // Type stable : cours_complet accepté par l'API ; le prompt détaillé (construirePrompt) fait le travail
      const typeMapping: Record<TypeContenu, string> = {
        fiche_cours: 'cours_complet',
        exercices:   'cours_complet',
        quiz_avance: 'cours_complet',
        sequence:    'cours_complet',
        devoir:      'cours_complet',
      };

      const payload = {
        type:       typeMapping[form.type],
        discipline: form.matiere || 'Général',
        classe:     form.niveau  || 'Collège',
        chapitre:   construirePrompt(),
      };

      const result = await window.electronAPI.aiGenerate(payload) as {
        success?: boolean; content?: string; error?: string; message?: string; _statusCode?: number;
      };

      const content = result.content;
      const errMsg = result.error ?? result.message;
      const status = result._statusCode;

      if (content && content.trim().length > 0) {
        setContenuGenere(content);
        setTitreSauvegarde(
          `${TYPES_CONTENU.find(t => t.id === form.type)?.label} — ${form.sujet}`
        );
      } else {
        let msg = errMsg && errMsg.trim();
        if (!msg) {
          msg = status === 401 || status === 403
            ? 'Licence invalide ou expirée. Vérifiez votre activation.'
            : status && status >= 500
            ? 'Serveur temporairement indisponible. Réessayez plus tard.'
            : !status
            ? 'Connexion impossible. Vérifiez votre connexion internet et que api.pedaclic.sn est accessible.'
            : 'Erreur lors de la génération. Réessayez ou contactez contact@pedaclic.sn.';
        }
        setError(msg);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Ouvrir modal de sauvegarde ─────────────────────────
  const ouvrirSauvegarde = async () => {
    // Charger tous les cahiers (toutes classes confondues)
    const data = await getCahiers();
    setCahiers(data.map(c => ({
      id: c.id,
      matiere: c.matiere,
      classe_nom: c.classe_nom,
      classe_id: c.classe_id,
    })));
    setCahierCible('');
    setClasseNouveauCahier(classes.length ? String(classes[0].id) : '');
    setShowSaveModal(true);
  };

  // ── Sauvegarder dans le cahier ─────────────────────────
  const handleSauvegarder = async () => {
    if (!titreSauvegarde.trim()) return;
    setIsSaving(true);

    try {
      let cahierId: number;

      if (cahierCible === 'nouveau') {
        if (!classes.length) throw new Error('Aucune classe disponible. Créez d\'abord une classe dans Mes classes.');
        const classeId = parseInt(classeNouveauCahier, 10);
        if (isNaN(classeId)) throw new Error('Sélectionnez la classe pour le nouveau cahier');
        const annee = new Date().getMonth() >= 9
          ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
          : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
        cahierId = await createCahier({
          classe_id: classeId,
          matiere: form.matiere || 'Général',
          annee,
        });
      } else {
        cahierId = parseInt(cahierCible, 10);
        if (isNaN(cahierId)) throw new Error('Sélectionnez un cahier');
      }

      await createEntree({
        cahier_id: cahierId,
        date_seance: new Date().toISOString().split('T')[0],
        titre: titreSauvegarde,
        contenu: contenuGenere,
      });

      setShowSaveModal(false);
      setSaveMsg('✅ Sauvegardé dans le cahier de textes !');
      setTimeout(() => setSaveMsg(''), 4000);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Copier dans le presse-papiers ──────────────────────
  const handleCopier = () => {
    navigator.clipboard.writeText(contenuGenere);
    setSaveMsg('✅ Copié dans le presse-papiers !');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const typeActif = TYPES_CONTENU.find(t => t.id === form.type)!;

  return (
    <div className="ia-page">

      {/* ── En-tête ── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">🤖 Générateur IA</h1>
          <p className="page-subtitle">Créez des contenus pédagogiques en quelques secondes</p>
        </div>
      </div>

      <div className="ia-layout">

        {/* ════════════════════════════════════════════════
            PANNEAU GAUCHE : Formulaire
        ════════════════════════════════════════════════ */}
        <div className="ia-form-panel">

          {/* Sélecteur de type */}
          <div className="type-selector">
            {TYPES_CONTENU.map(t => (
              <button key={t.id}
                className={`type-card ${form.type === t.id ? 'type-card--active' : ''}`}
                onClick={() => setForm(p => ({ ...p, type: t.id }))}
              >
                <span className="type-card__icon">{t.icon}</span>
                <span className="type-card__label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleGenerer} className="ia-form">

            {/* Matière + Niveau */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Matière</label>
                <select className="form-input"
                  value={form.matiere}
                  onChange={e => setForm(p => ({ ...p, matiere: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Niveau</label>
                <select className="form-input"
                  value={form.niveau}
                  onChange={e => setForm(p => ({ ...p, niveau: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Sujet */}
            <div className="form-field">
              <label className="form-label">Sujet / Titre *</label>
              <input className="form-input"
                value={form.sujet}
                onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
                placeholder={typeActif.promptHint}
                required />
            </div>

            {/* Détails */}
            <div className="form-field">
              <label className="form-label">Précisions (optionnel)</label>
              <textarea className="form-textarea"
                value={form.details}
                onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
                placeholder="Instructions particulières, points à insister, style souhaité..."
                rows={3} />
            </div>

            {/* Options selon le type */}
            {form.type === 'fiche_cours' && (
              <div className="form-field">
                <label className="form-label">Durée de la séance</label>
                <select className="form-input"
                  value={form.duree}
                  onChange={e => setForm(p => ({ ...p, duree: e.target.value }))}>
                  <option value="30min">30 minutes</option>
                  <option value="1h">1 heure</option>
                  <option value="1h30">1h30</option>
                  <option value="2h">2 heures</option>
                </select>
              </div>
            )}

            {form.type === 'exercices' && (
              <div className="form-field">
                <label className="form-label">Nombre d'exercices</label>
                <select className="form-input"
                  value={form.nbExercices}
                  onChange={e => setForm(p => ({ ...p, nbExercices: e.target.value }))}>
                  {['3', '5', '8', '10'].map(n => (
                    <option key={n} value={n}>{n} exercices</option>
                  ))}
                </select>
              </div>
            )}

            {form.type === 'quiz_avance' && (
              <div className="form-field">
                <label className="form-label">Nombre de questions</label>
                <select className="form-input"
                  value={form.nbExercices}
                  onChange={e => setForm(p => ({ ...p, nbExercices: e.target.value }))}>
                  {['5', '8', '10', '15', '20'].map(n => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
            )}

            {form.type === 'sequence' && (
              <div className="form-field">
                <label className="form-label">Nombre de séances</label>
                <select className="form-input"
                  value={form.nbSeances}
                  onChange={e => setForm(p => ({ ...p, nbSeances: e.target.value }))}>
                  {['2', '3', '4', '5', '6'].map(n => (
                    <option key={n} value={n}>{n} séances</option>
                  ))}
                </select>
              </div>
            )}

            {error && <div className="form-error">⚠️ {error}</div>}

            <button type="submit" className="btn-generer" disabled={isGenerating}>
              {isGenerating ? (
                <><span className="btn-spinner" /> Génération en cours...</>
              ) : (
                <>🤖 Générer avec l'IA</>
              )}
            </button>
          </form>
        </div>

        {/* ════════════════════════════════════════════════
            PANNEAU DROIT : Résultat
        ════════════════════════════════════════════════ */}
        <div className="ia-result-panel">

          {/* En-tête résultat */}
          <div className="result-header">
            <span className="result-header__title">
              {contenuGenere ? `${typeActif.icon} ${typeActif.label}` : 'Résultat'}
            </span>
            {contenuGenere && (
              <div className="result-actions">
                {saveMsg && <span className="save-msg">{saveMsg}</span>}
                <button className="btn-secondary btn-sm" onClick={handleCopier}>
                  📋 Copier
                </button>
                <button className="btn-primary btn-sm" onClick={ouvrirSauvegarde}>
                  💾 Sauvegarder
                </button>
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="result-body">
            {isGenerating ? (
              <div className="result-loading">
                <div className="ia-loader">
                  <div className="ia-loader__dot" />
                  <div className="ia-loader__dot" />
                  <div className="ia-loader__dot" />
                </div>
                <p>Claude génère votre contenu pédagogique...</p>
                <small>Cela prend généralement 10 à 30 secondes</small>
              </div>
            ) : contenuGenere ? (
              <pre className="result-text">{contenuGenere}</pre>
            ) : (
              <div className="result-empty">
                <div className="result-empty__icon">🎓</div>
                <h3>Prêt à générer</h3>
                <p>Remplissez le formulaire et cliquez sur<br /><strong>Générer avec l'IA</strong></p>
                <div className="result-tips">
                  <div className="tip">💡 Plus le sujet est précis, meilleur est le résultat</div>
                  <div className="tip">🇸🇳 Contenu adapté au programme sénégalais</div>
                  <div className="tip">💾 Sauvegardez directement dans le cahier de textes</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Sauvegarde ── */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>💾 Sauvegarder dans le cahier</h2>
              <button className="modal__close" onClick={() => setShowSaveModal(false)}>✕</button>
            </div>
            <div className="modal__form">
              <div className="form-field">
                <label className="form-label">Titre de la séance</label>
                <input className="form-input"
                  value={titreSauvegarde}
                  onChange={e => setTitreSauvegarde(e.target.value)}
                  placeholder="Titre à afficher dans le cahier" />
              </div>
              <div className="form-field">
                <label className="form-label">Cahier de textes cible</label>
                <select className="form-input"
                  value={cahierCible}
                  onChange={e => setCahierCible(e.target.value)}>
                  <option value="">— Sélectionner un cahier —</option>
                  {cahiers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.matiere} — {c.classe_nom}
                    </option>
                  ))}
                  <option value="nouveau">+ Créer un nouveau cahier</option>
                </select>
              </div>
              {cahierCible === 'nouveau' && (
                <div className="form-field">
                  <label className="form-label">Classe du nouveau cahier</label>
                  <select className="form-input"
                    value={classeNouveauCahier}
                    onChange={e => setClasseNouveauCahier(e.target.value)}>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  <small className="form-hint">Matière : {form.matiere || 'Général'} (définie par le formulaire)</small>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSauvegarder}
                disabled={isSaving || !titreSauvegarde || !cahierCible || (cahierCible === 'nouveau' && !classeNouveauCahier)}>
                {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
