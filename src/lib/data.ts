export interface SiteData {
  siteName: string;
  originalManhours: number; // 당초출력(A)
  changedManhours: number; // 변경출력(B)
  count: number; // 건수
}

export interface SummaryRow extends SiteData {
  monthlyManhours: number; // 월 출력공수 (관리자 입력)
  diff: number; // 대비 (B-A)
  ratio: number; // 변경공수 비율 (%)
}

import { getDocuments } from './approval';

// 월 출력공수 데이터 저장 (LocalStorage 모의)
// 브라우저 환경에서만 동작하므로 안전하게 접근
const getStorageKey = (month: string) => `manhours_${month}`;

export function getMonthlyManhours(month: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(getStorageKey(month));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

export function saveMonthlyManhours(month: string, data: Record<string, number>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(month), JSON.stringify(data));
  }
}

export function getSummaryData(month: string): SummaryRow[] {
  // 1. 해당 월의 실제 전자결재 데이터 가져오기 (결재완료, 수정완료만)
  const allDocs = getDocuments();
  const monthDocs = allDocs.filter(doc => {
    const isCompleted = doc.status === '결재완료' || doc.status === '수정완료';
    const docDate = doc.completeDate || doc.draftDate;
    return isCompleted && docDate.startsWith(month);
  });

  const siteMap: Record<string, SiteData> = {};
  
  monthDocs.forEach(doc => {
    if (!siteMap[doc.siteName]) {
      siteMap[doc.siteName] = {
        siteName: doc.siteName,
        originalManhours: 0,
        changedManhours: 0,
        count: 0
      };
    }
    
    siteMap[doc.siteName].count += 1;
    
    doc.rows.forEach(row => {
      siteMap[doc.siteName].originalManhours += (Number(row.originalA) || 0);
      siteMap[doc.siteName].changedManhours += (Number(row.changedB) || 0);
    });
  });

  const approvalData = Object.values(siteMap);
  
  // 2. 관리자가 입력/저장한 월 출력공수 데이터 가져오기
  const monthlyManhoursData = getMonthlyManhours(month);
  
  // 3. 화면용 데이터 조립 및 계산
  return approvalData.map(site => {
    const monthlyManhours = monthlyManhoursData[site.siteName] || 0;
    const diff = site.changedManhours - site.originalManhours;
    const ratio = monthlyManhours > 0 ? (site.changedManhours / monthlyManhours) * 100 : 0;
    
    return {
      ...site,
      monthlyManhours,
      diff,
      ratio: Number(ratio.toFixed(2)) // 소수점 둘째자리
    };
  });
}
