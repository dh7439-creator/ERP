'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './signup.module.css';
import { getSites, saveUser, UserRole } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [sites, setSites] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('현장 담당자');

  useEffect(() => {
    setSites(getSites());
  }, []);

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string; // Save password
    const name = formData.get('name') as string;
    const rank = formData.get('rank') as string;
    const site = formData.get('sites') as string;
    const role = formData.get('role') as UserRole;
    
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password,
      name,
      rank,
      role,
      sites: site ? [site] : []
    };
    
    saveUser(newUser);

    alert('회원가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox}>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>BOLIM 공수 관리 시스템</p>

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.inputGroup}>
            <label className="label" htmlFor="email">이메일 주소</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="input-field" 
              placeholder="example@bolimcon.co.kr"
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

          <div className={styles.inputGroup}>
            <label className="label" htmlFor="name">담당자 이름</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className="input-field" 
              placeholder="이름을 입력하세요"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className="label" htmlFor="rank">직급</label>
            <select id="rank" name="rank" className="input-field" defaultValue="">
              <option value="" disabled>직급을 선택해주세요</option>
              <option value="사원">사원</option>
              <option value="주임">주임</option>
              <option value="대리">대리</option>
              <option value="과장">과장</option>
              <option value="차장">차장</option>
              <option value="부장">부장</option>
            </select>
          </div>

          {selectedRole === '현장 담당자' && (
            <div className={styles.inputGroup}>
              <label className="label" htmlFor="site-select">현장명</label>
              <select id="site-select" name="sites" className="input-field" defaultValue="" required>
                <option value="" disabled>현장을 선택해주세요</option>
                {sites.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
              {sites.length === 0 && <span className={styles.emptySites}>등록된 현장이 없습니다.</span>}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className="label">권한 선택</label>
            <div className={styles.roleOptions}>
              <label className={styles.roleLabel}>
                <input 
                  type="radio" 
                  name="role" 
                  value="현장 담당자" 
                  checked={selectedRole === '현장 담당자'}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                />
                <span>현장 담당자</span>
              </label>
              <label className={styles.roleLabel}>
                <input 
                  type="radio" 
                  name="role" 
                  value="본사 담당자" 
                  checked={selectedRole === '본사 담당자'}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                />
                <span>본사 담당자</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btn-primary">회원가입 완료</button>
          </div>

          <div className={styles.loginContainer}>
            <span className={styles.loginText}>이미 계정이 있으신가요?</span>
            <Link href="/login" className={styles.loginLink}>
              로그인하기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
