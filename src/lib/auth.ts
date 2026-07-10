export type UserRole = '통합관리자' | '본사 담당자' | '현장 담당자';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  rank?: string; // 사원, 주임, 대리, 과장, 차장, 부장
  role: UserRole;
  sites?: string[]; // 현장 담당자의 경우
}

// 초기 데이터 (Mock)
const INITIAL_USERS: User[] = [
  {
    id: '1',
    email: 'dahye@bolimcon.co.kr',
    password: '031166',
    name: '임다혜',
    role: '통합관리자',
  }
];

const INITIAL_SITES: string[] = [
  '신반포 현대 ENG',
  '아산탕정',
  '인천검단 GS'
];

export function getSites(): string[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bolim_sites');
    if (stored) return JSON.parse(stored);
    
    localStorage.setItem('bolim_sites', JSON.stringify(INITIAL_SITES));
    return INITIAL_SITES;
  }
  return INITIAL_SITES;
}

export function saveSite(site: string) {
  if (typeof window !== 'undefined') {
    const sites = getSites();
    if (!sites.includes(site)) {
      sites.push(site);
      localStorage.setItem('bolim_sites', JSON.stringify(sites));
    }
  }
}

export function getUsers(): User[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bolim_users');
    if (stored) return JSON.parse(stored);
    
    // 초기 통합관리자 계정 세팅
    localStorage.setItem('bolim_users', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return INITIAL_USERS;
}

export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('bolim_users', JSON.stringify(users));
  }
}

export function authenticate(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bolim_current_user', JSON.stringify(user));
    }
    return user;
  }
  return null;
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bolim_current_user');
    if (stored) return JSON.parse(stored);
  }
  return null;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bolim_current_user');
  }
}
