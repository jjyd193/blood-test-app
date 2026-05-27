import { tests } from '../constants/tests';

export const STATUS = {
  NORMAL: 'normal',
  HIGH: 'high',
  LOW: 'low',
  RED: 'redFlag',
};

export function getRange(test, gender) {
  if (gender === 'male' && test.normalRange.male) return test.normalRange.male;
  if (gender === 'female' && test.normalRange.female) return test.normalRange.female;
  return test.normalRange.default || test.normalRange.male || test.normalRange.female || [null, null];
}

export function getRangeLabel(test, gender) {
  const [min, max] = getRange(test, gender);
  const basis = test.genderRequired ? (gender === 'female' ? '여성 기준' : '남성 기준') : '일반 기준';
  if (min === 0 && max != null) return `${max} ${test.unit} 이하 (${basis})`;
  if (test.reverse) return `${min} ${test.unit} 이상 (${basis})`;
  return `${min} – ${max} ${test.unit} (${basis})`;
}

export function isRedFlag(test, value, gender) {
  const rf = test.redFlag || {};
  if (rf.low !== undefined && value < rf.low) return true;
  if (rf.high !== undefined && value >= rf.high) return true;
  if (gender === 'male') {
    if (rf.maleLow !== undefined && value < rf.maleLow) return true;
    if (rf.maleHigh !== undefined && value > rf.maleHigh) return true;
  }
  if (gender === 'female') {
    if (rf.femaleLow !== undefined && value < rf.femaleLow) return true;
    if (rf.femaleHigh !== undefined && value > rf.femaleHigh) return true;
  }
  return false;
}

export function classifyValue(test, value, gender) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (isRedFlag(test, num, gender)) return STATUS.RED;
  const [min, max] = getRange(test, gender);
  if (test.reverse) return num >= min ? STATUS.NORMAL : STATUS.LOW;
  if (min !== null && num < min) return STATUS.LOW;
  if (max !== null && num > max) return STATUS.HIGH;
  return STATUS.NORMAL;
}

export function classifyRecord(record) {
  return tests
    .map((test) => {
      const value = record?.values?.[test.id];
      const status = classifyValue(test, value, record?.gender);
      if (!status) return null;
      return { test, value, status, rangeLabel: getRangeLabel(test, record?.gender) };
    })
    .filter(Boolean);
}

export function getStatusText(status) {
  return ({ normal:'정상', high:'다소 높음', low:'다소 낮음', redFlag:'병원 상담 권장' })[status] || '';
}

export function getStatusOrder(status) {
  return ({ redFlag:0, high:1, low:1, normal:2 })[status] ?? 9;
}

export function detectUnitConfusion(testId, rawValue) {
  if (!rawValue) return '';
  const value = Number(rawValue);
  if (Number.isNaN(value)) return '';
  const hasDecimal = String(rawValue).includes('.');
  if (testId === 'hba1c' && value >= 30) return '혹시 공복혈당을 잘못 넣으셨나요? HbA1c는 보통 4~12 사이 숫자입니다.';
  if (testId === 'glucose' && value >= 3 && value <= 25 && hasDecimal) return '공복혈당은 보통 70~200 정도예요. mmol/L 단위로 입력하셨다면 × 18 하면 돼요.';
  if (testId === 'hdl' && value >= 3 && value <= 9) return 'HDL은 보통 30 이상입니다. 검사지를 다시 한번 확인해주세요.';
  return '';
}
