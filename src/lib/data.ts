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

// 전자결재 연동 가상 데이터 (월별로 고정된 더미)
const MOCK_APPROVAL_DATA: Record<string, SiteData[]> = {
  '2026-07': [
    { siteName: '신반포 현대 ENG', originalManhours: 150.0, changedManhours: 171.5, count: 6 },
    { siteName: '아산탕정', originalManhours: 120.0, changedManhours: 135.0, count: 4 },
  ],
  '2026-08': [
    { siteName: '신반포 현대 ENG', originalManhours: 160.0, changedManhours: 170.0, count: 5 },
    { siteName: '아산탕정', originalManhours: 130.0, changedManhours: 130.0, count: 2 },
    { siteName: '평택 고덕 현장', originalManhours: 200.0, changedManhours: 250.0, count: 8 },
  ],
  '2026-09': [
    { siteName: '신반포 현대 ENG', originalManhours: 140.0, changedManhours: 160.0, count: 4 },
  ]
};

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
  // 1. 해당 월의 전자결재 연동 데이터 가져오기
  const approvalData = MOCK_APPROVAL_DATA[month] || [];
  
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
