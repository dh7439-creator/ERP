"use client";

import { useState, useMemo, Fragment, useRef, useEffect } from 'react';
import { parseExcelData } from '@/lib/excelParser';
import { getCurrentUser } from '@/lib/auth';
import styles from './iris.module.css';

const getWeekDates = (base) => {
  const curr = new Date(base);
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(diff + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (d) => {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[d.getDay()];
  return `${month}/${date}(${dayName})`; 
};

const toDateKey = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

export default function Home() {
  const [baseDate, setBaseDate] = useState(new Date());
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  
  const [sites, setSites] = useState([]);
  const [viewMode, setViewMode] = useState('main');
  const [activeUnrecDate, setActiveUnrecDate] = useState('ALL');

  const [memoModal, setMemoModal] = useState({ isOpen: false, siteIdx: null, dateKey: null, type: null, tempText: '', tempImage: null });
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  
  const isAdmin = user?.role === '통합관리자';

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseExcelData(file);
      
      setSites(prev => {
        const merged = prev.map(site => {
          const newRecords = {};
          for (let k in site.records) {
            newRecords[k] = { ...site.records[k] };
          }
          return { ...site, records: newRecords };
        });

        parsedData.forEach(newSite => {
          const existingIdx = merged.findIndex(s => s.name === newSite.name);
          
          let targetSite;
          if (existingIdx >= 0) {
            targetSite = merged[existingIdx];
          } else {
            targetSite = {
              name: newSite.name,
              records: {},
              unrecognized: []
            };
            merged.push(targetSite);
          }

          if (newSite.unrecognized) {
            if (!targetSite.unrecognized) targetSite.unrecognized = [];
            newSite.unrecognized.forEach(unrec => {
              const exists = targetSite.unrecognized.find(u => u.date === unrec.date && u.name === unrec.name);
              if (!exists) {
                targetSite.unrecognized.push(unrec);
              }
            });
          }

          newSite.records.forEach(record => {
            const key = record.date;
            if (!targetSite.records[key]) {
              targetSite.records[key] = { 
                dailyReport: 0, clockIn: 0, clockOut: 0, 
                memoTextDaily: '', memoImageDaily: null,
                memoTextClockIn: '', memoImageClockIn: null
              };
            }
            targetSite.records[key].clockIn = record.clockIn;
            targetSite.records[key].clockOut = record.clockOut;
          });
        });
        return merged;
      });
      e.target.value = '';
    } catch (err) {
      alert("엑셀 파일 파싱 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  const handleDailyReportChange = (siteIdx, dateKey, value) => {
    const numValue = parseInt(value) || 0;
    setSites(prev => {
      const newSites = [...prev];
      const site = { ...newSites[siteIdx] };
      const records = { ...site.records };
      if (!records[dateKey]) {
        records[dateKey] = { 
          dailyReport: 0, clockIn: 0, clockOut: 0, 
          memoTextDaily: '', memoImageDaily: null,
          memoTextClockIn: '', memoImageClockIn: null
        };
      }
      records[dateKey].dailyReport = numValue;
      site.records = records;
      newSites[siteIdx] = site;
      return newSites;
    });
  };

  const openMemo = (siteIdx, dateKey, type) => {
    const dayData = sites[siteIdx].records[dateKey] || {};
    const tempText = type === 'daily' ? dayData.memoTextDaily : dayData.memoTextClockIn;
    const tempImage = type === 'daily' ? dayData.memoImageDaily : dayData.memoImageClockIn;
    setMemoModal({
      isOpen: true,
      siteIdx,
      dateKey,
      type,
      tempText: tempText || '',
      tempImage: tempImage || null
    });
  };

  const closeMemo = () => {
    setMemoModal(prev => ({ ...prev, isOpen: false }));
  };

  const saveMemo = () => {
    const { siteIdx, dateKey, type, tempText, tempImage } = memoModal;
    setSites(prev => {
      const newSites = [...prev];
      const site = { ...newSites[siteIdx] };
      const records = { ...site.records };
      if (!records[dateKey]) {
        records[dateKey] = { 
          dailyReport: 0, clockIn: 0, clockOut: 0, 
          memoTextDaily: '', memoImageDaily: null,
          memoTextClockIn: '', memoImageClockIn: null
        };
      }
      if (type === 'daily') {
        records[dateKey].memoTextDaily = tempText;
        records[dateKey].memoImageDaily = tempImage;
      } else {
        records[dateKey].memoTextClockIn = tempText;
        records[dateKey].memoImageClockIn = tempImage;
      }
      site.records = records;
      newSites[siteIdx] = site;
      return newSites;
    });
    closeMemo();
  };

  const handleUnrecognizedChange = (siteIdx, unrecIdx, field, value) => {
    setSites(prev => {
      const newSites = [...prev];
      const site = { ...newSites[siteIdx] };
      const unrecognized = [...site.unrecognized];
      unrecognized[unrecIdx] = { ...unrecognized[unrecIdx], [field]: value };
      site.unrecognized = unrecognized;
      newSites[siteIdx] = site;
      return newSites;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMemoModal(prev => ({ ...prev, tempImage: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setMemoModal(prev => ({ ...prev, tempImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeWeek = (offset) => {
    setBaseDate(prev => {
      const nd = new Date(prev);
      nd.setDate(nd.getDate() + offset);
      return nd;
    });
  };

  const changeMonth = (offset) => {
    setBaseDate(prev => {
      const nd = new Date(prev);
      nd.setMonth(nd.getMonth() + offset);
      return nd;
    });
  };

  const goToThisWeek = () => {
    setBaseDate(new Date());
  };

  const handleKeyDown = (e, sIdx, dateKey) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); 
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      const targetIdx = sIdx + direction;
      const targetInput = document.getElementById(`input-daily-${targetIdx}-${dateKey}`);
      if (targetInput) {
        targetInput.focus();
        targetInput.select(); 
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          {viewMode === 'main' ? '홍채관리 (출력 인원)' : '미인식자 대시보드'}
        </h2>
        <div className={styles.actionGroup}>
          <button 
            onClick={() => setViewMode(v => v === 'main' ? 'unrecognized' : 'main')}
            className={styles.btnSecondary}
          >
            {viewMode === 'main' ? '미인식자 대시보드' : '메인 표로 돌아가기'}
          </button>
          {isAdmin && (
            <label className="btn-primary" style={{ padding: '8px 24px', width: 'auto', display: 'inline-block', margin: 0 }}>
              엑셀 업로드
              <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>

      {viewMode === 'main' && (
        <div className={styles.filterSection}>
          <button onClick={() => changeMonth(-1)} className={styles.navButton} title="이전 달">&laquo;</button>
          <button onClick={() => changeWeek(-7)} className={styles.navButton} title="이전 주">&lsaquo;</button>
          
          <div className={styles.navDate}>
            <input 
              type="month" 
              className={styles.monthSelect}
              value={`${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                if (e.target.value) {
                  setBaseDate(new Date(`${e.target.value}-01T00:00:00`));
                }
              }}
            />
            <span>|</span>
            <span>{formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}</span>
          </div>

          <button onClick={() => changeWeek(7)} className={styles.navButton} title="다음 주">&rsaquo;</button>
          <button onClick={() => changeMonth(1)} className={styles.navButton} title="다음 달">&raquo;</button>
          
          <button onClick={goToThisWeek} className={styles.btnSecondary} style={{ padding: '4px 12px', fontSize: '12px', marginLeft: '12px' }}>
            이번 주
          </button>
        </div>
      )}

      {viewMode === 'unrecognized' ? (
        <div>
          <div className={styles.filterSection} style={{ marginBottom: '16px' }}>
            <button 
              onClick={() => setActiveUnrecDate('ALL')}
              className={styles.btnSecondary}
              style={{ background: activeUnrecDate === 'ALL' ? '#F3F4F6' : '#FFFFFF' }}
            >
              전체 보기
            </button>
            {weekDates.map((d, i) => {
              const key = toDateKey(d);
              const isActive = activeUnrecDate === key;
              return (
                <button 
                  key={i} 
                  onClick={() => setActiveUnrecDate(key)}
                  className={styles.btnSecondary}
                  style={{ background: isActive ? '#E0F2FE' : '#FFFFFF', borderColor: isActive ? '#BAE6FD' : '#D1D5DB' }}
                >
                  {formatDate(d)}
                </button>
              );
            })}
          </div>

          <div>
            {(() => {
              const filteredSites = sites.map((site, originalSiteIdx) => {
                const filteredUnrec = activeUnrecDate === 'ALL' 
                  ? site.unrecognized || [] 
                  : (site.unrecognized || []).filter(u => u.date === activeUnrecDate);
                
                if (filteredUnrec.length === 0) return null;

                const totalUnrec = filteredUnrec.length;
                const resolvedCount = filteredUnrec.filter(u => u.isResolved).length;
                const pendingCount = totalUnrec - resolvedCount;
                
                return (
                  <div key={originalSiteIdx} className={styles.unrecCard}>
                    <div className={styles.unrecCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px' }}>{site.name}</span>
                        <span className={styles.badgeRed}>미확인 {pendingCount}명</span>
                        <span className={styles.badgeGreen}>확인완료 {resolvedCount}명</span>
                      </div>
                    </div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table} style={{ border: 'none' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '100px' }}>발생 일자</th>
                            <th style={{ width: '120px' }}>이름</th>
                            <th style={{ width: '100px' }}>확인 상태</th>
                            <th>가공 및 사유 작성</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUnrec.map((unrec, filteredIdx) => {
                            const unrecIdx = site.unrecognized.findIndex(u => u.date === unrec.date && u.name === unrec.name);
                            return (
                              <tr key={filteredIdx} style={{ opacity: unrec.isResolved ? 0.6 : 1 }}>
                                <td>{unrec.date}</td>
                                <td style={{ fontWeight: 700 }}>{unrec.name}</td>
                                <td>
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isAdmin ? 'pointer' : 'default' }}>
                                    <input 
                                      type="checkbox" 
                                      disabled={!isAdmin}
                                      checked={unrec.isResolved || false}
                                      onChange={(e) => handleUnrecognizedChange(originalSiteIdx, unrecIdx, 'isResolved', e.target.checked)}
                                      style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: unrec.isResolved ? '#059669' : '#DC2626' }}>
                                      {unrec.isResolved ? '완료' : '대기'}
                                    </span>
                                  </label>
                                </td>
                                <td style={{ padding: '8px' }}>
                                  <input 
                                    type="text" 
                                    className="input-field"
                                    disabled={!isAdmin}
                                    placeholder={isAdmin ? "사유를 입력해주세요" : "작성된 사유가 없습니다"}
                                    value={unrec.memo || ''}
                                    onChange={(e) => handleUnrecognizedChange(originalSiteIdx, unrecIdx, 'memo', e.target.value)}
                                    style={{ padding: '8px', fontSize: '13px' }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }).filter(Boolean);

              if (filteredSites.length === 0) {
                return (
                  <div className={styles.emptyState} style={{ textAlign: 'center' }}>
                    <p>{activeUnrecDate === 'ALL' ? '현재 기록된 미인식자가 없습니다.' : '선택하신 날짜에 발생한 미인식자가 없습니다.'}</p>
                  </div>
                );
              }

              return filteredSites;
            })()}
          </div>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>NO</th>
                <th className={styles.nowrap} style={{ minWidth: '150px' }}>현장명</th>
                {weekDates.map((date, idx) => {
                  return (
                    <Fragment key={idx}>
                      <th colSpan={2} className={date.getDay() === 0 ? styles.textRed : date.getDay() === 6 ? styles.textBlue : ''}>
                        {formatDate(date)}
                      </th>
                      <th style={{ width: '25px', background: '#E5E7EB' }}>메모</th>
                    </Fragment>
                  )
                })}
                <th style={{ width: '35px', background: '#E5E7EB' }}>합계</th>
                <th style={{ width: '35px', background: '#E5E7EB' }}>항목</th>
                <th style={{ width: '35px', background: '#E5E7EB' }}>비율</th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={3 + (weekDates.length * 3) + 3} className={styles.emptyState}>
                    우측 상단의 버튼을 눌러 엑셀 파일을 업로드해주세요.
                  </td>
                </tr>
              ) : (
                sites.map((site, sIdx) => {
                  let totalDaily = 0;
                  let totalClockIn = 0;
                  let totalClockOut = 0;

                  weekDates.forEach((date) => {
                    const dateKey = toDateKey(date);
                    const dayData = site.records[dateKey] || { dailyReport: 0, clockIn: 0, clockOut: 0 };
                    totalDaily += dayData.dailyReport;
                    totalClockIn += dayData.clockIn;
                    totalClockOut += dayData.clockOut;
                  });

                  const rateIn = totalDaily > 0 ? ((totalClockIn / totalDaily) * 100).toFixed(0) : 0;
                  const rateOut = totalDaily > 0 ? ((totalClockOut / totalDaily) * 100).toFixed(0) : 0;
                  const rateOutVsIn = totalClockIn > 0 ? ((totalClockOut / totalClockIn) * 100).toFixed(0) : 0;

                  return (
                    <Fragment key={sIdx}>
                      <tr>
                        <td rowSpan={3} style={{ background: '#F9FAFB', fontWeight: 600, color: '#6B7280' }}>{sIdx + 1}</td>
                        <td className={styles.nowrap} rowSpan={3} style={{ fontWeight: 700, textAlign: 'left' }}>{site.name}</td>
                        
                        {weekDates.map((date, dIdx) => {
                          const dateKey = toDateKey(date);
                          const dayData = site.records[dateKey] || {};
                          const dr = dayData.dailyReport || 0;
                          const ci = dayData.clockIn || 0;
                          const co = dayData.clockOut || 0;
                          const mismatch = dr > 0 && (dr !== ci || dr !== co || ci !== co);
                          const hasMemoDaily = dayData.memoTextDaily || dayData.memoImageDaily;
                          
                          return (
                            <Fragment key={dIdx}>
                              <td className={`${mismatch ? `${styles.mismatchTop} ${styles.mismatchLeft}` : ''} ${styles.nowrap}`} style={{ borderBottom: '1px dotted #E5E7EB', color: '#6B7280', fontSize: '11px', padding: '4px' }}>일보</td>
                              <td className={mismatch ? `${styles.mismatchTop} ${styles.mismatchRight}` : ''} style={{ borderBottom: '1px dotted #E5E7EB', padding: '4px' }}>
                                <input 
                                  id={`input-daily-${sIdx}-${dateKey}`}
                                  type="number" 
                                  disabled={!isAdmin}
                                  value={dayData.dailyReport || ''}
                                  onChange={(e) => handleDailyReportChange(sIdx, dateKey, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, sIdx, dateKey)}
                                  className={styles.numInput}
                                  placeholder="0"
                                />
                              </td>
                              <td style={{ borderBottom: '1px dotted #E5E7EB' }}>
                                <button 
                                  onClick={() => openMemo(sIdx, dateKey, 'daily')}
                                  className={`${styles.memoBtn} ${hasMemoDaily ? styles.hasMemo : styles.noMemo}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={hasMemoDaily ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                </button>
                              </td>
                            </Fragment>
                          );
                        })}

                        <td style={{ borderBottom: '1px dotted #E5E7EB', fontWeight: 700 }}>{totalDaily}</td>
                        <td className={styles.nowrap} style={{ borderBottom: '1px dotted #E5E7EB', color: '#6B7280', fontSize: '11px', textAlign: 'left', padding: '4px' }}>출근율</td>
                        <td style={{ borderBottom: '1px dotted #E5E7EB', fontWeight: 700 }}>{rateIn}%</td>
                      </tr>

                      <tr>
                        {weekDates.map((date, dIdx) => {
                          const dateKey = toDateKey(date);
                          const dayData = site.records[dateKey] || {};
                          const dr = dayData.dailyReport || 0;
                          const ci = dayData.clockIn || 0;
                          const co = dayData.clockOut || 0;
                          const mismatch = dr > 0 && (dr !== ci || dr !== co || ci !== co);
                          const hasMemoClockIn = dayData.memoTextClockIn || dayData.memoImageClockIn;
                          
                          return (
                            <Fragment key={dIdx}>
                              <td className={`${mismatch ? styles.mismatchLeft : ''} ${styles.nowrap}`} style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none', color: '#6B7280', fontSize: '11px', padding: '4px' }}>출근</td>
                              <td className={`${mismatch ? styles.mismatchRight : ''} ${styles.textBlue}`} style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none', padding: '4px' }}>
                                {dayData.clockIn || 0}
                              </td>
                              <td style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none' }}>
                                <button 
                                  onClick={() => openMemo(sIdx, dateKey, 'clockIn')}
                                  className={`${styles.memoBtn} ${hasMemoClockIn ? styles.hasMemo : styles.noMemo}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={hasMemoClockIn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                </button>
                              </td>
                            </Fragment>
                          );
                        })}
                        <td className={styles.textBlue} style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none' }}>{totalClockIn}</td>
                        <td className={styles.nowrap} style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none', color: '#6B7280', fontSize: '11px', textAlign: 'left', padding: '4px' }}>퇴근율</td>
                        <td className={styles.textBlue} style={{ borderBottom: '1px dotted #E5E7EB', borderTop: 'none' }}>{rateOut}%</td>
                      </tr>

                      <tr>
                        {weekDates.map((date, dIdx) => {
                          const dateKey = toDateKey(date);
                          const dayData = site.records[dateKey] || {};
                          const dr = dayData.dailyReport || 0;
                          const ci = dayData.clockIn || 0;
                          const co = dayData.clockOut || 0;
                          const mismatch = dr > 0 && (dr !== ci || dr !== co || ci !== co);
                          
                          return (
                            <Fragment key={dIdx}>
                              <td className={`${mismatch ? `${styles.mismatchBottom} ${styles.mismatchLeft}` : ''} ${styles.nowrap}`} style={{ borderTop: 'none', color: '#6B7280', fontSize: '11px', padding: '4px' }}>퇴근</td>
                              <td className={`${mismatch ? `${styles.mismatchBottom} ${styles.mismatchRight}` : ''} ${styles.textOrange}`} style={{ borderTop: 'none', padding: '4px' }}>
                                {dayData.clockOut || 0}
                              </td>
                              <td style={{ borderTop: 'none' }}></td>
                            </Fragment>
                          );
                        })}
                        <td className={styles.textOrange} style={{ borderTop: 'none' }}>{totalClockOut}</td>
                        <td className={styles.nowrap} style={{ borderTop: 'none', color: '#6B7280', fontSize: '11px', textAlign: 'left', padding: '4px' }}>출/퇴율</td>
                        <td className={styles.textOrange} style={{ borderTop: 'none' }}>{rateOutVsIn}%</td>
                      </tr>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {memoModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <span>{sites[memoModal.siteIdx]?.name} - {memoModal.dateKey} 메모</span>
              <button onClick={closeMemo} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div>
                <label className="label">메모 내용</label>
                <textarea 
                  value={memoModal.tempText}
                  disabled={!isAdmin}
                  onChange={(e) => setMemoModal(prev => ({ ...prev, tempText: e.target.value }))}
                  placeholder={isAdmin ? "사유 등을 적어주세요." : "작성된 메모가 없습니다."}
                  className={styles.textarea}
                />
              </div>

              <div>
                <label className="label">이미지 첨부</label>
                {memoModal.tempImage ? (
                  <div style={{ position: 'relative', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={memoModal.tempImage} alt="첨부 이미지" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    {isAdmin && (
                      <button 
                        onClick={removeImage}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                      >&times;</button>
                    )}
                  </div>
                ) : (
                  <label className={`${styles.uploadArea} ${!isAdmin ? styles.uploadAreaDisabled : ''}`}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
                    <p style={{ fontSize: '12px' }}>{isAdmin ? "클릭하여 이미지 파일 업로드" : "이미지가 없습니다"}</p>
                    <input ref={fileInputRef} type="file" accept="image/*" disabled={!isAdmin} style={{ display: 'none' }} onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeMemo} className={styles.btnSecondary}>{isAdmin ? '취소' : '닫기'}</button>
              {isAdmin && <button onClick={saveMemo} className="btn-primary" style={{ width: 'auto', margin: 0, padding: '8px 24px' }}>저장</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
