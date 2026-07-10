'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDocuments, saveDocument, ApprovalDocument, ApprovalRow, generateId } from '@/lib/approval';
import { getCurrentUser, getUsers, User } from '@/lib/auth';
import styles from '../approval.module.css';

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params?.id as string;
  const isNew = docId === 'new';

  const [user, setUser] = useState<User | null>(null);
  const [hqUsers, setHqUsers] = useState<User[]>([]);
  
  const [doc, setDoc] = useState<ApprovalDocument>({
    id: isNew ? generateId() : docId,
    siteName: '',
    title: '',
    drafter: '',
    draftDate: new Date().toISOString().split('T')[0],
    status: '임시저장',
    rows: [{
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      team: '',
      name: '',
      originalA: 0,
      changedB: 0,
      diff: 0,
      reason: ''
    }],
    approvalLine: {
      hq1: '',
      hq2: '',
      hq1Status: 'PENDING',
      hq2Status: 'PENDING'
    }
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    const allUsers = getUsers();
    setHqUsers(allUsers.filter(u => u.role === '본사 담당자' || u.role === '통합관리자'));

    if (isNew && currentUser) {
      setDoc(prev => ({
        ...prev,
        siteName: currentUser.sites?.[0] || '지정되지 않음',
        drafter: currentUser.name
      }));
    } else if (!isNew) {
      const existing = getDocuments().find(d => d.id === docId);
      if (existing) setDoc(existing);
    }
  }, [isNew, docId]);

  const handleRowChange = (index: number, field: keyof ApprovalRow, value: any) => {
    const newRows = [...doc.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // Auto calculate diff
    if (field === 'originalA' || field === 'changedB') {
      const a = Number(newRows[index].originalA) || 0;
      const b = Number(newRows[index].changedB) || 0;
      newRows[index].diff = b - a;
    }
    
    setDoc({ ...doc, rows: newRows });
  };

  const addRow = () => {
    setDoc({
      ...doc,
      rows: [...doc.rows, {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        team: '',
        name: '',
        originalA: 0,
        changedB: 0,
        diff: 0,
        reason: ''
      }]
    });
  };

  const removeRow = (index: number) => {
    if (doc.rows.length <= 1) return;
    const newRows = [...doc.rows];
    newRows.splice(index, 1);
    setDoc({ ...doc, rows: newRows });
  };

  const save = (newStatus: ApprovalDocument['status']) => {
    const updated = { ...doc, status: newStatus };
    if (newStatus === '결재완료' || newStatus === '수정완료') {
      updated.completeDate = new Date().toISOString().split('T')[0];
    }
    saveDocument(updated);
    
    let msg = '저장되었습니다.';
    if (newStatus === '결재중') msg = '결재가 전송되었습니다. (본사 담당자 1에게 알림이 발송됩니다)';
    if (newStatus === '결재완료') msg = '최종 결재가 완료되었습니다! (기안자에게 알림이 발송됩니다)';
    if (newStatus === '반송') msg = '문서가 반송되었습니다. (기안자에게 알림이 발송됩니다)';
    if (newStatus === '수정완료') msg = '수정 완료 처리되었습니다. (기안자에게 알림이 발송됩니다)';
    
    alert(msg);
    router.push('/approval');
  };

  // Permissions & Visibility
  const isDrafter = user?.name === doc.drafter;
  const isHQ1 = user?.name === doc.approvalLine.hq1;
  const isHQ2 = user?.name === doc.approvalLine.hq2;
  const showTimeInputs = !isNew && (isHQ1 || isHQ2 || user?.role === '통합관리자' || user?.role === '본사 담당자');
  const canEditLine = isNew || isDrafter || user?.role === '통합관리자' || user?.role === '본사 담당자';
  const canEditGrid = isNew || (isDrafter && (doc.status === '임시저장' || doc.status === '반송'));

  // Totals
  const totalA = doc.rows.reduce((acc, r) => acc + (Number(r.originalA) || 0), 0);
  const totalB = doc.rows.reduce((acc, r) => acc + (Number(r.changedB) || 0), 0);
  const totalDiff = doc.rows.reduce((acc, r) => acc + (Number(r.diff) || 0), 0);

  return (
    <div className={styles.container}>
      <table className={styles.approvalHeaderTable}>
        <tbody>
          <tr>
            <th className={styles.bgGray} style={{ width: '90px' }}>문서번호</th>
            <td colSpan={2}>{doc.id}</td>
            <td colSpan={2} className={styles.docMainTitle}>업 무 연 락</td>
            <th className={styles.bgGray} style={{ width: '90px' }}>기안일</th>
            <td style={{ width: '120px' }}>{doc.draftDate}</td>
          </tr>
          <tr>
            <th className={styles.bgGray} rowSpan={3}>결<br/><br/>재</th>
            <td colSpan={2} rowSpan={3} style={{ fontWeight: 600 }}>{doc.siteName}</td>
            <th className={styles.bgGray}>기안자</th>
            <th className={styles.bgGray}>본사 담당자 1</th>
            <th className={styles.bgGray} colSpan={2}>본사 담당자 2</th>
          </tr>
          <tr>
            <td>{doc.drafter}</td>
            <td>
              {canEditLine && doc.status === '임시저장' ? (
                <select 
                  value={doc.approvalLine.hq1}
                  onChange={e => setDoc({...doc, approvalLine: {...doc.approvalLine, hq1: e.target.value}})}
                  style={{ width: '100%', padding: '4px', textAlign: 'center', border: 'none', background: 'transparent' }}
                >
                  <option value="">선택</option>
                  {hqUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              ) : (
                doc.approvalLine.hq1 || '미지정'
              )}
            </td>
            <td colSpan={2}>
              {canEditLine && doc.status === '임시저장' ? (
                <select 
                  value={doc.approvalLine.hq2}
                  onChange={e => setDoc({...doc, approvalLine: {...doc.approvalLine, hq2: e.target.value}})}
                  style={{ width: '100%', padding: '4px', textAlign: 'center', border: 'none', background: 'transparent' }}
                >
                  <option value="">선택</option>
                  {hqUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              ) : (
                doc.approvalLine.hq2 || '미지정'
              )}
            </td>
          </tr>
          <tr>
            <td style={{ color: '#10B981', fontSize: '12px' }}>{doc.draftDate}</td>
            <td style={{ color: doc.approvalLine.hq1Status === 'APPROVED' ? '#10B981' : '#F59E0B', fontSize: '12px' }}>
              {!isNew ? doc.approvalLine.hq1Status : ''}
            </td>
            <td colSpan={2} style={{ color: doc.approvalLine.hq2Status === 'APPROVED' ? '#10B981' : '#F59E0B', fontSize: '12px' }}>
              {!isNew ? doc.approvalLine.hq2Status : ''}
            </td>
          </tr>
          <tr>
            <th className={styles.bgGray}>참 조</th>
            <td colSpan={6} className={styles.textLeft}></td>
          </tr>
          <tr>
            <th className={styles.bgGray}>기안자</th>
            <td colSpan={2}>{doc.drafter}</td>
            <th className={styles.bgGray}>기안현장</th>
            <td colSpan={3} className={styles.textLeft}>{doc.siteName}</td>
          </tr>
          <tr>
            <th className={styles.bgGray}>제 목</th>
            <td colSpan={6} className={styles.textLeft}>
              <input 
                type="text" 
                value={doc.title} 
                onChange={e => setDoc({...doc, title: e.target.value})}
                placeholder="제목을 입력하세요"
                disabled={!canEditGrid}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', backgroundColor: 'transparent' }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className={styles.gridSection}>
        <div className={styles.gridActions}>
          {canEditGrid && (
            <>
              <button className={styles.btnMini} onClick={addRow}>+ 행 추가</button>
              <button className={styles.btnMini} onClick={() => removeRow(doc.rows.length - 1)}>- 행 삭제</button>
            </>
          )}
        </div>
        
        <table className={styles.table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>팀명</th>
              <th>이름</th>
              <th>당초출력(A)</th>
              <th>변경출력(B)</th>
              <th>대비(B-A)</th>
              <th>변경사유</th>
              {showTimeInputs && <th>출근시간</th>}
              {showTimeInputs && <th>퇴근시간</th>}
            </tr>
          </thead>
          <tbody>
            {doc.rows.map((row, idx) => (
              <tr key={row.id}>
                <td><input type="date" className={styles.gridInput} value={row.date} onChange={e => handleRowChange(idx, 'date', e.target.value)} disabled={!canEditGrid} /></td>
                <td><input type="text" className={styles.gridInput} value={row.team} onChange={e => handleRowChange(idx, 'team', e.target.value)} disabled={!canEditGrid} /></td>
                <td><input type="text" className={styles.gridInput} value={row.name} onChange={e => handleRowChange(idx, 'name', e.target.value)} disabled={!canEditGrid} /></td>
                <td><input type="number" step="0.1" className={styles.gridInput} value={row.originalA} onChange={e => handleRowChange(idx, 'originalA', e.target.value)} disabled={!canEditGrid} /></td>
                <td><input type="number" step="0.1" className={styles.gridInput} value={row.changedB} onChange={e => handleRowChange(idx, 'changedB', e.target.value)} disabled={!canEditGrid} /></td>
                <td style={{fontWeight: 600, color: row.diff > 0 ? '#EF4444' : '#3B82F6'}}>{row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}</td>
                <td><input type="text" className={styles.gridInput} value={row.reason} onChange={e => handleRowChange(idx, 'reason', e.target.value)} disabled={!canEditGrid} /></td>
                {showTimeInputs && (
                  <>
                    <td><input type="time" className={styles.gridInput} value={row.checkIn || ''} onChange={e => handleRowChange(idx, 'checkIn', e.target.value)} disabled={!(isHQ1 || isHQ2 || user?.role === '통합관리자')} /></td>
                    <td><input type="time" className={styles.gridInput} value={row.checkOut || ''} onChange={e => handleRowChange(idx, 'checkOut', e.target.value)} disabled={!(isHQ1 || isHQ2 || user?.role === '통합관리자')} /></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan={3}>합계</td>
              <td>{totalA.toFixed(1)}</td>
              <td>{totalB.toFixed(1)}</td>
              <td style={{color: totalDiff > 0 ? '#EF4444' : '#3B82F6'}}>{totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(1)}</td>
              <td></td>
              {showTimeInputs && <td colSpan={2}></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.bottomActions}>
        <button className="btn-secondary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => router.push('/approval')}>목록으로</button>
        
        {isNew || (isDrafter && (doc.status === '임시저장' || doc.status === '반송')) ? (
          <>
            <button className="btn-secondary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => save('임시저장')}>임시저장</button>
            <button className="btn-primary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => save('결재중')}>결재 전송</button>
          </>
        ) : null}

        {isHQ1 && doc.status === '결재중' && doc.approvalLine.hq1Status === 'PENDING' && (
          <>
            <button className="btn-secondary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => save('결재중')}>저장 (출/퇴근시간)</button>
            <button className="btn-danger" style={{width: 'auto', padding: '12px 32px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px'}} onClick={() => save('반송')}>반송</button>
            <button className="btn-primary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => {
              doc.approvalLine.hq1Status = 'APPROVED';
              save('결재중'); // Status remains 결재중 until HQ2 approves
              alert('본사 담당자 2에게 결재가 넘어갑니다.');
            }}>결재</button>
          </>
        )}

        {isHQ2 && doc.status === '결재중' && doc.approvalLine.hq1Status === 'APPROVED' && doc.approvalLine.hq2Status === 'PENDING' && (
          <>
            <button className="btn-danger" style={{width: 'auto', padding: '12px 32px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px'}} onClick={() => save('반송')}>반송</button>
            <button className="btn-secondary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => save('수정완료')}>수정완료</button>
            <button className="btn-primary" style={{width: 'auto', padding: '12px 32px'}} onClick={() => {
              doc.approvalLine.hq2Status = 'APPROVED';
              save('결재완료');
            }}>결재 (최종 승인)</button>
          </>
        )}
      </div>
    </div>
  );
}
