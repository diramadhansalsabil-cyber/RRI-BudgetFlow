const SESSION_KEY = 'session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user) {
  const { password, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function login(username, password) {
  const { users } = JSON.parse(localStorage.getItem('rri_budgetflow') || '{}');
  const user = users?.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    setSession(user);
    return { password, ...user };
  }
  return null;
}
