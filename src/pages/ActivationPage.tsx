/**
 * PedaClic Pro Desktop — ActivationPage.tsx
 * Page d'activation de licence (s'affiche si aucune licence valide)
 */
import { useState } from 'react';
import './ActivationPage.css';

interface Props {
  onActivated?: () => void;
}

export default function ActivationPage({ onActivated }: Props) {
  const [key, setKey]           = useState('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // ── Formater la clé en temps réel (PEDA-XXXX-XXXX-XXXX-XXXX) ──
  const handleKeyChange = (val: string) => {
    // Supprimer tout sauf lettres/chiffres/tirets
    const clean = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setKey(clean);
    setError('');
  };

  // ── Soumettre l'activation ─────────────────────────────────────
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey.startsWith('PEDA-') || cleanKey.length < 24) {
      setError('Format invalide. La clé doit être de la forme PEDA-XXXX-XXXX-XXXX-XXXX');
      return;
    }

    if (typeof window.electronAPI?.licenceActivate !== 'function') {
      setError('Application non disponible (ouvrez via Electron).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await window.electronAPI.licenceActivate(cleanKey);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => onActivated?.(), 1500);
      } else {
        const messages: Record<string, string> = {
          NOT_FOUND:    'Clé de licence introuvable. Vérifiez votre email d\'achat.',
          EXPIRED:      'Cette licence a expiré. Renouvelez sur www.pedaclic.sn',
          WRONG_MACHINE:'Licence déjà activée sur un autre appareil. Contactez contact@pedaclic.sn',
          SUSPENDED:    'Licence suspendue. Contactez contact@pedaclic.sn',
        };
        setError(messages[res.code as string] ?? res.message ?? 'Clé invalide ou connexion requise');
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activation-page">

      {/* Panneau gauche */}
      <div className="activation-left">
        <div className="activation-left__logo">🎓</div>
        <h1 className="activation-left__title">PedaClic Pro</h1>
        <p className="activation-left__subtitle">Application bureau pour enseignants</p>

        <div className="activation-left__features">
          <div className="feature-item">📚 Gestion des classes et élèves</div>
          <div className="feature-item">📊 Notes et moyennes automatiques</div>
          <div className="feature-item">📅 Suivi des absences</div>
          <div className="feature-item">📔 Cahier de textes numérique</div>
          <div className="feature-item">🤖 Génération de contenus IA</div>
          <div className="feature-item">✈️ 100% hors-ligne</div>
        </div>

        <div className="activation-left__footer">
          Pas encore de licence ?{' '}
          <a href="https://www.pedaclic.sn/pro" target="_blank" rel="noreferrer">
            Commander sur pedaclic.sn
          </a>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="activation-right">
        <div className="activation-card">

          <div className="activation-card__header">
            <div className="activation-card__icon">🔑</div>
            <h2>Activation de la licence</h2>
            <p>Entrez votre clé reçue par email après l'achat</p>
          </div>

          {success ? (
            <div className="activation-success">
              <div className="activation-success__icon">✅</div>
              <h3>Licence activée avec succès !</h3>
              <p>Bienvenue sur PedaClic Pro...</p>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="activation-form">

              <div className="form-field">
                <label className="form-label">Clé de licence</label>
                <input
                  className={`activation-key-input ${error ? 'activation-key-input--error' : ''}`}
                  value={key}
                  onChange={e => handleKeyChange(e.target.value)}
                  placeholder="PEDA-XXXX-XXXX-XXXX-XXXX"
                  maxLength={24}
                  required
                  autoFocus
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="activation-error">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="activation-btn"
                disabled={isLoading || key.length < 10}
              >
                {isLoading ? (
                  <><span className="btn-spinner" /> Vérification en cours...</>
                ) : (
                  '🔓 Activer ma licence'
                )}
              </button>

              <p className="activation-note">
                🌐 Une connexion internet est requise pour l'activation unique.<br />
                L'application fonctionnera 100% hors-ligne ensuite.
              </p>
            </form>
          )}

          <div className="activation-card__support">
            Besoin d'aide ? <a href="mailto:contact@pedaclic.sn">contact@pedaclic.sn</a>
          </div>
        </div>
      </div>
    </div>
  );
}
