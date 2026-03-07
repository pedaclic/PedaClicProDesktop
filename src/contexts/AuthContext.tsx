import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../db/ipcDatabase';
import { sendVerificationEmail } from '../services/authService';
import type { Utilisateur } from '../types';

function generateSecureToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  utilisateur: Utilisateur | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{
    success: boolean;
    error?: string;
    requireVerification?: boolean;
    message?: string;
  }>;
}

interface RegisterData {
  nom: string; prenom: string; email: string;
  password: string; matiere?: string; etablissement?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurer la session (ID sauvegardé localement)
  useEffect(() => {
    const savedId = localStorage.getItem('pedaclic_uid');
    if (savedId) {
      dbGet<Utilisateur & { email_verified?: number }>(
        'SELECT id, nom, prenom, email, matiere, etablissement, created_at, email_verified FROM utilisateur WHERE id = ?',
        [parseInt(savedId)]
      ).then((u) => {
        if (u && (u.email_verified === undefined || u.email_verified === 1)) {
          const { email_verified: _, ...rest } = u;
          setUtilisateur(rest as Utilisateur);
        } else {
          localStorage.removeItem('pedaclic_uid');
        }
      }).catch(() => localStorage.removeItem('pedaclic_uid'))
       .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      type Row = Utilisateur & { password: string; email_verified?: number };
      const row = await dbGet<Row>('SELECT * FROM utilisateur WHERE email = ?', [email.toLowerCase().trim()]);
      if (!row) return { success: false, error: 'Email ou mot de passe incorrect' };
      if (!await bcrypt.compare(password, row.password))
        return { success: false, error: 'Email ou mot de passe incorrect' };
      if (row.email_verified === 0) {
        return { success: false, error: 'Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte mail.' };
      }
      const { password: _p, email_verified: _v, ...user } = row;
      setUtilisateur(user as Utilisateur);
      localStorage.setItem('pedaclic_uid', String(row.id));
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = () => {
    setUtilisateur(null);
    localStorage.removeItem('pedaclic_uid');
  };

  const register = async (data: RegisterData) => {
    try {
      const email = data.email.toLowerCase().trim();
      const existing = await dbGet<{ id: number }>('SELECT id FROM utilisateur WHERE email = ?', [email]);
      if (existing) return { success: false, error: 'Cet email est déjà utilisé' };

      const hash = await bcrypt.hash(data.password, 12);
      const r = await dbRun(
        `INSERT INTO utilisateur (nom, prenom, email, password, matiere, etablissement, email_verified)
         VALUES (?,?,?,?,?,?,0)`,
        [data.nom, data.prenom, email, hash, data.matiere ?? '', data.etablissement ?? '']
      );
      const userId = r.lastInsertRowid as number;
      if (!userId) return { success: false, error: 'Erreur lors de la création du compte' };

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const tr = await dbRun(
        'INSERT INTO email_verification_tokens (utilisateur_id, token, expires_at) VALUES (?,?,?)',
        [userId, token, expiresAt]
      );
      if (!tr.success) return { success: false, error: 'Erreur lors de la préparation de la vérification' };

      const sendRes = await sendVerificationEmail(email, token);
      if (!sendRes.success) {
        return {
          success: false,
          error: sendRes.error || 'Impossible d\'envoyer l\'email de vérification. Vérifiez votre connexion.',
        };
      }
      return {
        success: true,
        requireVerification: true,
        message: 'Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.',
      };
    } catch {
      return { success: false, error: 'Erreur lors de la création du compte' };
    }
  };

  return (
    <AuthContext.Provider value={{ utilisateur, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};