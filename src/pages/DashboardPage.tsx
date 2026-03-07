import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();
  const heure = new Date().getHours();
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
        {salut}, {utilisateur?.prenom} ! 👋
      </h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>
        {utilisateur?.matiere && `${utilisateur.matiere} · `}
        {utilisateur?.etablissement || 'PedaClic Pro Desktop'}
      </p>

      {/* Cartes de raccourci — grille parfaite 3×2 (ou 2×3 sur mobile) */}
      <div className="dashboard-cards-grid">
        {[
          { icon: '📚', label: 'Mes Classes', sub: 'Gérer vos groupes', path: '/classes' },
          { icon: '📊', label: 'Notes', sub: 'Saisir les évaluations', path: '/notes' },
          { icon: '📅', label: 'Absences', sub: 'Suivi quotidien', path: '/absences' },
          { icon: '📔', label: 'Cahier', sub: 'Séances et devoirs', path: '/cahier' },
          { icon: '🤖', label: 'IA', sub: 'Générer du contenu', path: '/ia' },
          { icon: '📄', label: 'Export PDF', sub: 'Bulletins et listes', path: '/export' },
        ].map(card => (
          <div
            key={card.path}
            role="button"
            tabIndex={0}
            style={{
              background: '#fff', borderRadius: 12, padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)', cursor: 'pointer',
              border: '1.5px solid #e2e8f0', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            onClick={() => navigate(card.path)}
            onKeyDown={e => e.key === 'Enter' && navigate(card.path)}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}