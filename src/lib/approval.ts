import { User } from './auth';

export type ApprovalStatus = '임시저장' | '결재중' | '결재완료' | '수정완료' | '반송';

export interface ApprovalRow {
  id: string;
  date: string;
  team: string;
  name: string;
  originalA: number;
  changedB: number;
  diff: number; // B - A
  reason: string;
  checkIn?: string; // 본사 담당자 입력
  checkOut?: string; // 본사 담당자 입력
}

export interface ApprovalDocument {
  id: string;
  siteName: string;
  title: string;
  drafter: string; // User ID or Name
  draftDate: string; // YYYY-MM-DD
  completeDate?: string;
  status: ApprovalStatus;
  rows: ApprovalRow[];
  approvalLine: {
    hq1?: string; // User Name
    hq2?: string; // User Name
    hq1Status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    hq2Status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
}

const STORAGE_KEY = 'bolim_approvals';

export function getDocuments(): ApprovalDocument[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  }
  return [];
}

export function saveDocument(doc: ApprovalDocument) {
  if (typeof window !== 'undefined') {
    const docs = getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index > -1) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
