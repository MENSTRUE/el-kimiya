// ELKIMIYA_V82_LOGIN_REQUIRED
export type AccessRole = 'guest' | 'user' | 'moduler';
export const authRoutes = ['account', 'register', 'reset'] as const;
export const isAuthRoute = (page: string) => (authRoutes as readonly string[]).includes(page);
const learnerRoutes = new Set(['mission','dashboard','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about']);
export function resolveRoute(page: string, role: AccessRole): string {
  if (page === 'landing') return 'landing';
  if (role === 'guest') return page === 'guest' || isAuthRoute(page) ? page : 'account';
  if (role === 'moduler') return 'moduler';
  return learnerRoutes.has(page) ? page : 'dashboard';
}
// Remove the obsolete guest permission; it is never consulted again.
export function writeGuest(_value: boolean) {
  try { sessionStorage.removeItem('elk.v81.guestEntered'); } catch { /* storage optional */ }
}
