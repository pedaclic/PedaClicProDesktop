/**
 * PedaClic Pro Desktop — VerifyEmailPage
 * Vérification d'email après inscription.
 * Reçoit le token via URL (?token=) ou via le protocole pedaclic:// (event IPC)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmailToken } from '../services/authService';
import './LoginPage.css';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    tokenFromUrl ? 'verifying' : 'idle'
  );
  const [message, setMessage] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  const doVerify = async (token: string) => {
    if (!token.trim()) return;
    setStatus('verifying');
    setMessage('');
    const res = await verifyEmailToken(token.trim());
    if (res.success) {
      setStatus('success');
      setMessage('Votre adresse email a été vérifiée. Vous pouvez maintenant vous connecter.');
      setTimeout(() => navigate('/login?verified=1'), 2500);
    } else {
      setStatus('error');
      setMessage(res.error ?? 'Lien expiré ou invalide.');
    }
  };

  useEffect(() => {
    if (tokenFromUrl) doVerify(tokenFromUrl);
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doVerify(tokenInput);
  };

  return (
    <div className="login-page">
      <div className="login-page__left">
        <div className="login-page__brand">
          <div className="login-page__brand-icon">✉️</div>
          <h1 className="login-page__brand-name">Vérification d'email</h1>
          <p className="login-page__brand-sub">Activez votre compte PedaClic Pro</p>
        </div>
      </div>

      <div className="login-page__right">
        <div className="login-card">
          {status === 'verifying' && (
            <div className="login-card__success" style={{ padding: 24, textAlign: 'center' }}>
              <span className="btn-spinner" style={{ display: 'inline-block', marginBottom: 12 }} />
              <p>Vérification en cours…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="login-card__success" style={{ padding: 24 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
              <p>{message}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Redirection vers la connexion…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="login-card__error" style={{ margin: 16 }}>
              ⚠️ {message}
              <button
                type="button"
                className="login-card__submit"
                style={{ marginTop: 12 }}
                onClick={() => { setStatus('idle'); setTokenInput(''); }}
              >
                Réessayer
              </button>
            </div>
          )}

          {(status === 'idle' || (status === 'error' && !message)) && (
            <form className="login-card__form" onSubmit={handleSubmit}>
              <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
                Si vous n'avez pas cliqué sur le lien reçu par email, collez ici le code de vérification :
              </p>
              <div className="form-field">
                <label className="form-label">Code de vérification</label>
                <input
                  className="form-input"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Collez le token du lien (pedaclic://verify?token=...)"
                  disabled={status === 'verifying'}
                />
              </div>
              <button
                className="login-card__submit"
                type="submit"
                disabled={status === 'verifying' || !tokenInput.trim()}
              >
                Vérifier
              </button>
              <button
                type="button"
                className="form-input"
                style={{ marginTop: 12, background: 'transparent', cursor: 'pointer', border: '1px solid #d1d5db' }}
                onClick={() => navigate('/login')}
              >
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
