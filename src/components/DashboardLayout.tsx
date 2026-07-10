'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout, User } from '@/lib/auth';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.brand}>BOLIM ERP</h2>
          <span className={styles.badge} data-role={user.role}>{user.role}</span>
        </div>
        <nav className={styles.nav}>
          <Link 
            href="/summary" 
            className={`${styles.navItem} ${pathname === '/summary' ? styles.active : ''}`}
          >
            출력공수 변경 집계표
          </Link>
          
          <Link 
            href="/approval" 
            className={`${styles.navItem} ${pathname.startsWith('/approval') ? styles.active : ''}`}
          >
            전자결재
          </Link>
          
          {user.role === '통합관리자' && (
            <Link 
              href="/admin" 
              className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}
            >
              관리자 설정
            </Link>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
        </div>
      </aside>

      <main className={styles.content}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>
            {pathname === '/summary' && '출력공수 변경 집계표'}
            {pathname.startsWith('/approval') && '전자결재'}
            {pathname === '/admin' && '관리자 설정'}
          </h1>
          <div className={styles.userProfile}>
            {user.name} ({user.role})
          </div>
        </header>

        <div className={styles.mainArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
