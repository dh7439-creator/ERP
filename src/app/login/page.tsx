'use client';

import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
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

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label className="label" htmlFor="email">이메일 주소</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="input-field" 
              placeholder="이메일을 입력하세요"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className="label" htmlFor="password">비밀번호</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className="input-field" 
              placeholder="비밀번호를 입력하세요"
              required 
            />
          </div>

          <button type="submit" className="btn-primary">로그인</button>

          <div className={styles.saveIdContainer}>
            <input type="checkbox" id="saveId" className={styles.checkbox} />
            <label htmlFor="saveId" className={styles.saveIdLabel}>아이디 저장</label>
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
