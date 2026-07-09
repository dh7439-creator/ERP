'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './forgot.module.css';
import { getUsers, User } from '@/lib/auth';

type Step = 'EMAIL' | 'CODE' | 'NEW_PASSWORD';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 이메일 확인 모의 로직
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      // 이메일이 존재하면 인증 코드 단계로 이동 (모의: 코드는 123456 고정)
      setStep('CODE');
    } else {
      setError('가입된 이메일이 없습니다.');
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (code === '123456') {
      setStep('NEW_PASSWORD');
    } else {
      setError('인증 코드가 일치하지 않습니다. (테스트용 코드: 123456)');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 비밀번호 수정 모의 처리 완료
    alert('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>비밀번호 찾기</h1>
        
        {step === 'EMAIL' && (
          <>
            <p className={styles.subtitle}>가입하신 이메일 주소를 입력해 주시면<br/>비밀번호 재설정을 위한 임시 코드를 보내드립니다.</p>
            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className="label" htmlFor="email">이메일 주소</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field" 
                  placeholder="이메일을 입력하세요"
                  required 
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className="btn-primary">임시 코드 받기</button>
            </form>
          </>
        )}

        {step === 'CODE' && (
          <>
            <p className={styles.subtitle}><b>{email}</b>(으)로 임시 코드를 발송했습니다.<br/>코드를 아래에 입력해 주세요.</p>
            <form onSubmit={handleCodeSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className="label" htmlFor="code">임시 코드</label>
                <input 
                  type="text" 
                  id="code" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-field" 
                  placeholder="6자리 코드 입력 (테스트: 123456)"
                  required 
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className="btn-primary">코드 확인</button>
            </form>
          </>
        )}

        {step === 'NEW_PASSWORD' && (
          <>
            <p className={styles.subtitle}>인증이 완료되었습니다.<br/>새로운 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className="label" htmlFor="newPassword">새 비밀번호</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field" 
                  placeholder="새 비밀번호 입력"
                  required 
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-primary">비밀번호 변경하기</button>
            </form>
          </>
        )}

        <div className={styles.backContainer}>
          <Link href="/login" className={styles.backLink}>
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
