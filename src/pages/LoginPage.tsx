import React, { useState, useEffect } from 'react';
import { DISCIPLINES } from '../constants/disciplines';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      setSuccessMsg('Email vérifié ! Vous pouvez maintenant vous connecter.');
      setSearchParams({}, { replace: true });
      setMode('login');
    }
  }, [searchParams, setSearchParams]);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', matiere: '', etablissement: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      if (res.success) {
        if ('requireVerification' in res && res.requireVerification) {
          setError('');
          navigate('/verify-email', { state: { message: res.message } });
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.error ?? 'Erreur inconnue');
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div className="login-page">
      {/* ── Panneau gauche ── */}
      <div className="login-page__left">
        <div className="login-page__brand">
          <div className="login-page__brand-icon">🎓</div>
          <h1 className="login-page__brand-name">PedaClic Pro</h1>
          <p className="login-page__brand-sub">Application bureau pour enseignants</p>
        </div>
        <ul className="login-page__features">
          {['📚 Gestion des classes et élèves', '📊 Notes et moyennes automatiques',
            '📅 Suivi des absences', '📔 Cahier de textes numérique',
            '🤖 Génération de contenus IA', '📄 Export PDF bulletins', '✈️ 100% hors-ligne'].map(f => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      {/* ── Formulaire ── */}
      <div className="login-page__right">
        <div className="login-card">
          <div className="login-card__tabs">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m}
                className={`login-card__tab ${mode === m ? 'login-card__tab--active' : ''}`}
                onClick={() => { setMode(m); setError(''); }}>
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form className="login-card__form" onSubmit={onSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Prénom *</label>
                    <input className="form-input" name="prenom" value={form.prenom}
                      onChange={onChange} placeholder="Mamadou" required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Nom *</label>
                    <input className="form-input" name="nom" value={form.nom}
                      onChange={onChange} placeholder="Diallo" required />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Matière enseignée</label>
                  <input className="form-input" name="matiere" value={form.matiere}
                    onChange={onChange} placeholder="Mathématiques, Français, SVT..."
                    list="matieres-login" />
                  <datalist id="matieres-login">
                    {DISCIPLINES.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div className="form-field">
                  <label className="form-label">Établissement</label>
                  <input className="form-input" name="etablissement" value={form.etablissement}
                    onChange={onChange} placeholder="Lycée Blaise Diagne, Dakar" />
                </div>
              </>
            )}

            <div className="form-field">
              <label className="form-label">Adresse email *</label>
              <input className="form-input" name="email" type="email" value={form.email}
                onChange={onChange} placeholder="vous@exemple.sn" required />
            </div>
            <div className="form-field">
              <label className="form-label">Mot de passe *</label>
              <input className="form-input" name="password" type="password" value={form.password}
                onChange={onChange} placeholder="••••••••" required minLength={6} />
            </div>

            {successMsg && <div className="login-card__success" style={{ marginBottom: 12 }}>✅ {successMsg}</div>}
            {error && <div className="login-card__error">⚠️ {error}</div>}

            <button className="login-card__submit" type="submit" disabled={isLoading}>
              {isLoading ? <span className="btn-spinner" /> : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}