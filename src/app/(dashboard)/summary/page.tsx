'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '@/lib/auth';
import { getSummaryData, saveMonthlyManhours, SummaryRow } from '@/lib/data';
import styles from './summary.module.css';

export default function SummaryPage() {
  const [user, setUser] = useState<User | null>(null);
  
  // Date state (default to 2026-07 to match the requirement)
  const [currentDate, setCurrentDate] = useState(new Date('2026-07-01T00:00:00'));
  
  // Data state
  const [rows, setRows] = useState<SummaryRow[]>([]);
  
  // Local state for edits
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState('');

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}-${month}`;

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    // Load data when month changes
    const data = getSummaryData(monthKey);
    setRows(data);
    
    // Initialize inputs state with loaded data
    const initialInputs: Record<string, string> = {};
    data.forEach(row => {
      initialInputs[row.siteName] = row.monthlyManhours > 0 ? String(row.monthlyManhours) : '';
    });
    setInputs(initialInputs);
    setSaveMessage('');
  }, [monthKey]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleInputChange = (siteName: string, value: string) => {
    // Allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setInputs(prev => ({ ...prev, [siteName]: value }));
      setSaveMessage('');
    }
  };

  const handleSave = () => {
    // Prepare data to save
    const dataToSave: Record<string, number> = {};
    Object.keys(inputs).forEach(siteName => {
      const val = parseFloat(inputs[siteName]);
      dataToSave[siteName] = isNaN(val) ? 0 : val;
    });

    saveMonthlyManhours(monthKey, dataToSave);
    
    // Reload rows to reflect saved calculations
    const updatedData = getSummaryData(monthKey);
    setRows(updatedData);
    
    setSaveMessage('저장되었습니다.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const isAdmin = user?.role === '통합관리자';

  // Calculate totals
  const totalMonthlyManhours = rows.reduce((acc, row) => acc + (parseFloat(inputs[row.siteName]) || row.monthlyManhours || 0), 0);
  const totalOriginal = rows.reduce((acc, row) => acc + row.originalManhours, 0);
  const totalChanged = rows.reduce((acc, row) => acc + row.changedManhours, 0);
  const totalDiff = totalChanged - totalOriginal;
  const totalCount = rows.reduce((acc, row) => acc + row.count, 0);
  const totalRatio = totalMonthlyManhours > 0 ? ((totalChanged / totalMonthlyManhours) * 100).toFixed(2) : '0.00';

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>출력공수 변경 집계표</h2>
        {isAdmin && (
          <div className={styles.actionGroup}>
            {saveMessage && <span className={styles.saveMsg}>{saveMessage}</span>}
            <button className="btn-primary" style={{ padding: '8px 24px', width: 'auto' }} onClick={handleSave}>
              저장
            </button>
          </div>
        )}
      </div>

      <div className={styles.filterSection}>
        <button className={styles.monthBtn} onClick={handlePrevMonth}>◀ 이전달</button>
        <span className={styles.currentMonth}>{year}년 {month}월</span>
        <button className={styles.monthBtn} onClick={handleNextMonth}>다음달 ▶</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NO</th>
              <th>현장명</th>
              <th>월 출력공수</th>
              <th>당초출력(A)</th>
              <th>변경출력(B)</th>
              <th>대비(B-A)</th>
              <th>건수</th>
              <th>변경공수 비율(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>해당 월에 승인된 결재 데이터가 없습니다.</td>
              </tr>
            ) : (
              rows.map((row, index) => {
                // 실시간 계산
                const currentInputVal = parseFloat(inputs[row.siteName]) || 0;
                const currentRatio = currentInputVal > 0 ? ((row.changedManhours / currentInputVal) * 100).toFixed(2) : '0.00';
                
                return (
                  <tr key={row.siteName}>
                    <td>{index + 1}</td>
                    <td>{row.siteName}</td>
                    <td>
                      {isAdmin ? (
                        <input 
                          type="text" 
                          className={styles.numInput}
                          value={inputs[row.siteName] ?? ''}
                          onChange={(e) => handleInputChange(row.siteName, e.target.value)}
                          placeholder="0.0"
                        />
                      ) : (
                        row.monthlyManhours.toFixed(1)
                      )}
                    </td>
                    <td>{row.originalManhours.toFixed(1)}</td>
                    <td>{row.changedManhours.toFixed(1)}</td>
                    <td className={row.diff > 0 ? styles.textRed : styles.textBlue}>
                      {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}
                    </td>
                    <td>{row.count}건</td>
                    <td>{currentRatio}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className={styles.totalRow}>
                <td colSpan={2}>합계</td>
                <td>{totalMonthlyManhours.toFixed(1)}</td>
                <td>{totalOriginal.toFixed(1)}</td>
                <td>{totalChanged.toFixed(1)}</td>
                <td className={totalDiff > 0 ? styles.textRed : styles.textBlue}>
                  {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(1)}
                </td>
                <td>{totalCount}건</td>
                <td>{totalRatio}%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
