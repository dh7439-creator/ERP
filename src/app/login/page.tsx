'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { authenticate } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveId, setSaveId] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setSaveId(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (saveId) {
      localStorage.setItem('savedEmail', email);
    } else {
      localStorage.removeItem('savedEmail');
    }

    const user = authenticate(email, password);
    if (user) {
      router.push('/summary'); // 모두 집계표 화면으로 기본 이동
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoSection}>
          <div className={styles.logoImage}>
            {/* The user will upload their logo image here later */}
            <img src="/logo.png" alt="Bolim 로고" className={styles.logo} onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"><path fill="%2300A651" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
            }} />
          </div>
          <span className={styles.logoText}>BOLIM</span>
        </div>
        
        <h1 className={styles.title}>공수 관리 시스템</h1>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div style={{color: '#EF4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center'}}>{error}</div>}
          <div className={styles.inputGroup}>
            <label className="label" htmlFor="email">이메일 주소</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
              placeholder="이메일을 입력하세요"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className="label" htmlFor="password">비밀번호</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                name="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                placeholder="비밀번호를 입력하세요"
                required 
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary">로그인</button>

          <div className={styles.saveIdContainer}>
            <div className={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="saveId" 
                className={styles.checkbox} 
                checked={saveId}
                onChange={(e) => setSaveId(e.target.checked)}
              />
              <label htmlFor="saveId" className={styles.saveIdLabel}>아이디 저장</label>
            </div>
            <Link href="/forgot-password" className={styles.forgotPasswordLink}>
              비밀번호 찾기
            </Link>
          </div>

          <div className={styles.signupContainer}>
            <Link href="/signup" className={styles.signupButton}>
              새로운 계정 만들기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
