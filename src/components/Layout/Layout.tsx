/**
 * PedaClic Pro Desktop — Layout principal avec sidebar et zone de contenu
 * Structure : sidebar repliable + en-tête + Outlet pour les pages
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Tableau de bord',   icon: '🏠', path: '/dashboard' },
  { id: 'classes',    label: 'Mes classes',        icon: '📚', path: '/classes' },
  { id: 'eleves',     label: 'Listes élèves',      icon: '👨‍🎓', path: '/eleves' },
  { id: 'notes',      label: 'Notes et moyennes', icon: '📊', path: '/notes' },
  { id: 'absences',   label: 'Absences',           icon: '📅', path: '/absences' },
  { id: 'cahier',     label: 'Cahier de textes',   icon: '📔', path: '/cahier' },
  { id: 'sequences',  label: 'Séquences',          icon: '📋', path: '/sequences' },
  { id: 'ia',         label: 'Générateur IA',     icon: '🤖', path: '/ia' },
  { id: 'export',     label: 'Export PDF',         icon: '📄', path: '/export-pdf' },
];

export default function Layout() {
  const { utilisateur, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    if (typeof window?.electronAPI?.getAppVersion === 'function') {
      window.electronAPI.getAppVersion().then(setAppVersion).catch(() => {});
    }
  }, []);

  return (
    <div className={`layout ${sidebarOpen ? 'layout--sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon">🎓</span>
          <div>
            <span className="sidebar__logo-name">PedaClic</span>
            <span className="sidebar__logo-tag">Pro</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ id, path, icon, label }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {utilisateur?.prenom?.[0]}{utilisateur?.nom?.[0]}
            </div>
            <div>
              <div className="sidebar__user-name">
                {utilisateur?.prenom} {utilisateur?.nom}
              </div>
              <div className="sidebar__user-matiere">{utilisateur?.matiere || 'Enseignant'}</div>
            </div>
          </div>
          <button type="button" className="sidebar__logout-btn" onClick={logout}>
            <span className="sidebar__nav-icon">🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Zone principale */}
      <main className="layout__main">
        <header className="layout__header">
          <button
            type="button"
            className="header__toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Réduire le menu' : 'Ouvrir le menu'}
          >
            ☰
          </button>
          <span className="header__spacer" />
          <span className="header__version">{appVersion}</span>
        </header>

        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
