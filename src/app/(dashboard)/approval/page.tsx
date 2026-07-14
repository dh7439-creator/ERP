'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDocuments, ApprovalDocument } from '@/lib/approval';
import { getCurrentUser, User } from '@/lib/auth';
import styles from './approval.module.css';

export default function ApprovalListPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<ApprovalDocument[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('전체');
  const [siteFilter, setSiteFilter] = useState('전체');

  useEffect(() => {
    setUser(getCurrentUser());
    setDocs(getDocuments());
  }, []);

  const handleDraft = () => {
    router.push('/approval/new');
  };

  const filteredDocs = docs.filter(d => {
    if (statusFilter !== '전체' && d.status !== statusFilter) return false;
    if (siteFilter !== '전체' && d.siteName !== siteFilter) return false;
    
    // 현장 담당자는 자신의 문서 또는 자기 현장의 문서만 조회 가능
    if (user?.role === '현장 담당자') {
      if (!user.sites?.includes(d.siteName)) return false;
    }
    
    return true;
  });

  // 고유 현장 목록 추출 (필터용)
  const uniqueSites = Array.from(new Set(docs.map(d => d.siteName)));

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>전자결재 목록</h2>
        <button className="btn-primary" onClick={handleDraft} style={{ padding: '8px 24px', width: 'auto' }}>
          기안
        </button>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>상태</label>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="전체">전체</option>
            <option value="결재중">결재중</option>
            <option value="결재완료">결재완료</option>
            <option value="수정완료">수정완료</option>
            <option value="임시저장">임시저장</option>
            <option value="반송">반송</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>현장별</label>
          <select className={styles.filterSelect} value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
            <option value="전체">전체</option>
            {uniqueSites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>현장명</th>
            <th>제목</th>
            <th>기안자</th>
            <th>기안일</th>
            <th>완료일</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocs.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.emptyState}>조회된 문서가 없습니다.</td>
            </tr>
          ) : (
            filteredDocs.map(doc => (
              <tr key={doc.id} className={styles.clickableRow} onClick={() => router.push(`/approval/${doc.id}`)}>
                <td>{doc.siteName}</td>
                <td className={styles.docTitle}>{doc.title}</td>
                <td>{doc.drafter}</td>
                <td>{doc.draftDate}</td>
                <td>{doc.completeDate || '-'}</td>
                <td>
                  <span className={styles.statusBadge} data-status={doc.status}>
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
