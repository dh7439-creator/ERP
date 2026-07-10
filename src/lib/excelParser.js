import * as XLSX from 'xlsx';

/**
 * 엑셀 파일을 읽고 데이터를 파싱합니다.
 * @param {File} file 업로드된 엑셀 파일
 * @returns {Promise<Array>} 파싱된 현장별 출퇴근 데이터
 */
export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // cellDates 옵션을 true로 주어 엑셀의 날짜 형식을 자바스크립트 Date 객체로 우선 파싱하도록 유도합니다.
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // raw: false 대신 cellDates를 사용했으므로 기본 설정 사용
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const siteDataMap = new Map();

        json.forEach((row) => {
          // B열: 현장명
          const siteNameKey = Object.keys(row).find(key => key.includes('현장명'));
          // 공수 확인용
          const gongsuKey = Object.keys(row).find(key => key.includes('공수'));
          // F열: 출근시간
          const clockInKey = Object.keys(row).find(key => key.includes('출근시간'));
          // H열: "인증회수" (줄바꿈/띄어쓰기 완전 무시하고 매칭)
          const authCountKey = Object.keys(row).find(key => key.replace(/\s+/g, '').includes('인증회수'));
          // 성명/이름 확인용 (미인식자 기록용) - 띄어쓰기 완전 무시 및 다양한 단어(작업자, 근무자 등) 포괄
          const nameKey = Object.keys(row).find(key => {
            const k = key.replace(/\s+/g, '');
            return k.includes('성명') || k.includes('이름') || k.includes('근로자') || k.includes('근무자') || k.includes('작업자') || k.includes('사용자') || k.includes('직원') || k.includes('노무자');
          });

          // 팀명/소속 확인용
          const teamKey = Object.keys(row).find(key => {
            const k = key.replace(/\s+/g, '');
            return k.includes('팀명') || k.includes('소속') || k.includes('업체');
          });

          // 공수가 비어있거나 정확히 '0'이면 무조건 통계 및 미인식자에서 완전 제외 (가장 먼저 컷)
          // 단, '0.1' 등 소수점이 있는 경우는 통과
          const gongsuValue = gongsuKey && row[gongsuKey] !== undefined ? String(row[gongsuKey]).trim() : '';
          if (gongsuValue === '' || gongsuValue === '0') return;

          if (siteNameKey && row[siteNameKey]) {
            const siteName = String(row[siteNameKey]).trim();
            if (!siteName || siteName === '0' || siteName === '현장명') return;

            const clockInValue = clockInKey ? row[clockInKey] : null;
            let dateStr = null;
            let hasClockIn = false;

            if (clockInValue !== null && clockInValue !== '') {
              hasClockIn = true;
              
              if (clockInValue instanceof Date) {
                // 자바스크립트 Date 객체로 파싱된 경우
                dateStr = `${clockInValue.getFullYear()}-${String(clockInValue.getMonth() + 1).padStart(2, '0')}-${String(clockInValue.getDate()).padStart(2, '0')}`;
              } else if (typeof clockInValue === 'number') {
                // 엑셀 숫자형(일련번호)으로 파싱된 경우
                try {
                  const parsed = XLSX.SSF.parse_date_code(clockInValue);
                  dateStr = `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
                } catch(e) {}
              } else {
                // 문자열인 경우 (정규식으로 관대하게 추출)
                const strVal = String(clockInValue).trim();
                if (strVal.length > 0) {
                  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD 또는 그 뒤에 AM/PM 등 모든 포맷 대응
                  const dateMatch = strVal.match(/(\d{4})[-\/\. ]+(\d{1,2})[-\/\. ]+(\d{1,2})/);
                  if (dateMatch) {
                    const year = dateMatch[1];
                    const month = dateMatch[2].padStart(2, '0');
                    const day = dateMatch[3].padStart(2, '0');
                    dateStr = `${year}-${month}-${day}`;
                  } else {
                    // 최후의 수단으로 일반 Date 파싱 시도
                    const d = new Date(strVal);
                    if (!isNaN(d.getTime())) {
                       dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                  }
                } else {
                  hasClockIn = false;
                }
              }
            }
            
            const authCount = authCountKey ? parseInt(row[authCountKey], 10) : 0;
            const hasClockOut = !isNaN(authCount) && authCount >= 2;
            const isUnrecognized = !isNaN(authCount) && authCount === 1;

            // 만약 미인식자도 아니고 출/퇴근 인정도 안되면 무시
            if (!hasClockIn && !hasClockOut && !isUnrecognized) return;

            // 날짜를 끝내 찾지 못했다면 현재 행은 무시합니다 (에러 방지)
            if (!dateStr) return;

            if (!siteDataMap.has(siteName)) {
              siteDataMap.set(siteName, {
                name: siteName,
                records: [], // { date: 'YYYY-MM-DD', clockIn: 1, clockOut: 1 } 배열
                unrecognized: [] // { date: 'YYYY-MM-DD', name: '홍길동' } 
              });
            }

            const currentSite = siteDataMap.get(siteName);
            
            // 미인식자 처리 (인증회수 1)
            if (isUnrecognized) {
              const workerName = nameKey && row[nameKey] ? String(row[nameKey]).trim() : '이름없음';
              const teamName = teamKey && row[teamKey] ? String(row[teamKey]).trim() : '';
              currentSite.unrecognized.push({
                date: dateStr,
                name: workerName,
                team: teamName
              });
            }
            
            // 해당 날짜의 레코드가 있는지 확인
            let dayRecord = currentSite.records.find(r => r.date === dateStr);
            if (!dayRecord) {
              dayRecord = { date: dateStr, clockIn: 0, clockOut: 0 };
              currentSite.records.push(dayRecord);
            }

            if (hasClockIn) {
              dayRecord.clockIn += 1;
            }
            if (hasClockOut) {
              dayRecord.clockOut += 1;
            }
          }
        });

        resolve(Array.from(siteDataMap.values()));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
