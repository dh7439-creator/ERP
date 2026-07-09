'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { getUsers, saveUser, User, UserRole } from '@/lib/auth';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'accounts' | 'sites' | 'roles'>('accounts');

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'accounts' ? '#10B981' : '#F3F4F6', color: activeTab === 'accounts' ? '#FFF' : '#374151', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setActiveTab('accounts')}
        >
          ① 계정관리
        </button>
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'sites' ? '#10B981' : '#F3F4F6', color: activeTab === 'sites' ? '#FFF' : '#374151', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setActiveTab('sites')}
        >
          ② 담당 배정 현장 관리
        </button>
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'roles' ? '#10B981' : '#F3F4F6', color: activeTab === 'roles' ? '#FFF' : '#374151', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setActiveTab('roles')}
        >
          ③ 권한 관리
        </button>
      </div>

      <div>
        {activeTab === 'accounts' && <AccountManagement users={users} />}
        {activeTab === 'sites' && <SiteManagement users={users} />}
        {activeTab === 'roles' && <RoleManagement users={users} />}
      </div>
    </div>
  );
}

function AccountManagement({ users }: { users: User[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>담당자 목록</h3>
        <button className={styles.btnSmall}>+ 새 담당자 등록</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>권한</th>
            <th>담당 현장 수</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className={styles.roleBadge} data-role={u.role}>{u.role}</span></td>
              <td>{u.sites?.length || 0}개</td>
              <td>
                <button className={styles.btnText}>수정</button>
                <button className={styles.btnTextDanger}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SiteManagement({ users }: { users: User[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>현장 배정 현황</h3>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>담당자 이름</th>
            <th>이메일</th>
            <th>담당 현장 목록</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <div className={styles.siteList}>
                  {u.sites?.length ? u.sites.map(s => (
                    <span key={s} className={styles.siteBadge}>{s}</span>
                  )) : <span className={styles.emptyText}>배정된 현장 없음</span>}
                </div>
              </td>
              <td>
                <button className={styles.btnText}>배정/수정</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleManagement({ users }: { users: User[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>권한 안내 및 현황</h3>
      </div>
      <div className={styles.roleInfoGrid}>
        <div className={styles.roleInfoCard}>
          <h4>통합관리자</h4>
          <p>모든 계정, 권한, 현장 배정 관리 가능. (현재 {users.filter(u=>u.role==='통합관리자').length}명)</p>
        </div>
        <div className={styles.roleInfoCard}>
          <h4>본사 담당자</h4>
          <p>전체 현장 공수 데이터 조회 및 승인 가능. (현재 {users.filter(u=>u.role==='본사 담당자').length}명)</p>
        </div>
        <div className={styles.roleInfoCard}>
          <h4>현장 담당자</h4>
          <p>배정된 현장의 공수 데이터만 입력 및 조회 가능. (현재 {users.filter(u=>u.role==='현장 담당자').length}명)</p>
        </div>
      </div>
    </div>
  );
}
