/**
 * PedaClic Pro Desktop — authService.ts
 * Services d'authentification : envoi et vérification d'email
 */

export async function sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window.electronAPI?.authSendVerificationEmail !== 'function') {
    return { success: false, error: 'Fonction non disponible' };
  }
  try {
    const r = await window.electronAPI.authSendVerificationEmail(email, token) as { success?: boolean; error?: string };
    return { success: r.success === true, error: r.error };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window.electronAPI?.authVerifyEmail !== 'function') {
    return { success: false, error: 'Fonction non disponible' };
  }
  try {
    const r = await window.electronAPI.authVerifyEmail(token) as { success?: boolean; error?: string };
    return { success: r.success === true, error: r.error };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
