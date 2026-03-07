/**
 * PedaClic Pro Desktop — App.tsx
 * Point d'entrée de l'application : contrôle d'accès (licence + auth) et routing.
 * Ordre des guards : 1) Licence → 2) Auth → 3) Routes protégées
 */
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import ElevesPage from './pages/ElevesPage';
import NotesPage from './pages/NotesPage';
import AbsencesPage from './pages/AbsencesPage';
import CahierPage from './pages/CahierPage';
import IAPage from './pages/IAPage';
import ExportPDFPage from './pages/ExportPDFPage'; // Export PDF : bulletins, listes de classe, cahier de textes
import ActivationPage from './pages/ActivationPage';
import './styles/globals.css';

// ── Guard licence : bloque l'accès si aucune licence active ─────
function LicenceGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking]   = useState(true);
  const [licenceOk, setLicenceOk] = useState(false);

  useEffect(() => {
    async function verifier() {
      try {
        // Vérification 100% hors-ligne : lecture table licence en SQLite
        const result = await window.electronAPI?.licenceCheck();
        setLicenceOk(result?.valid === true);
      } catch {
        setLicenceOk(false);
      } finally {
        setChecking(false);
      }
    }
    verifier();
  }, []);

  // Affichage du splash pendant la vérification
  if (checking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f0f4ff', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>🎓</div>
        <p style={{ color: '#2563eb', fontWeight: 600 }}>Chargement de PedaClic Pro...</p>
      </div>
    );
  }

  // Licence invalide → page d'activation (onActivated met à jour licenceOk)
  if (!licenceOk) return <ActivationPage onActivated={() => setLicenceOk(true)} />;

  return <>{children}</>;
}

// ── Guard auth : redirige vers /login si non connecté ─────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { utilisateur, isLoading } = useAuth();

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f0f4ff',
    }}>
      <div className="spinner" />
    </div>
  );

  return utilisateur ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Écoute du protocole pedaclic://verify (ouverture depuis lien email) ─
function VerifyEmailListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const unsub = window.electronAPI?.onVerifyEmailToken?.((token: string) => {
      navigate(`/verify-email?token=${encodeURIComponent(token)}`);
    });
    return () => unsub?.();
  }, [navigate]);
  return null;
}

// ── Composant racine : arborescence des providers et routes ─────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LicenceGuard>
          <VerifyEmailListener />
          <Routes>
            {/* Pages publiques : connexion et vérification email (sans Layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Zone protégée : Layout + sidebar, routes imbriquées */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<DashboardPage />} />
              <Route path="classes"    element={<ClassesPage />} />
              <Route path="eleves"     element={<ElevesPage />} />
              <Route path="notes"      element={<NotesPage />} />
              <Route path="absences"   element={<AbsencesPage />} />
              <Route path="cahier"     element={<CahierPage />} />
              {/* Générateur IA : création de contenus pédagogiques assistée */}
              <Route path="ia"         element={<IAPage />} />
              {/* Export PDF : génère bulletins scolaires, listes d'appel, feuilles de composition, cahier de textes (via @react-pdf/renderer) */}
              <Route path="export-pdf"  element={<ExportPDFPage />} />
            </Route>

            {/* Redirection des URLs inconnues vers le tableau de bord */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </LicenceGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}
