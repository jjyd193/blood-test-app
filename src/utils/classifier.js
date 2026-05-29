import { tests } from '../constants/tests';

export const STATUS = {
  NORMAL: 'normal',
  HIGH: 'high',
  LOW: 'low',
  RED: 'redFlag',
};

export function getAgeGroup(ageGroup) {
  return ({
    under30: 'under30',
    thirties: 'thirties',
    forties: 'forties',
    fifties: 'fifties',
    sixties: 'sixties',
    over70: 'over70',
    '30대 미만': 'under30',
    '30-39세': 'thirties',
    '40-49세': 'forties',
    '50-59세': 'fifties',
    '60-69세': 'sixties',
    '70세 이상': 'over70',
    under50: 'fifties',
    '50대 미만': 'fifties',
    '50-64': 'fifties',
    '50-64세': 'fifties',
    '65-74': 'sixties',
    '65-74세': 'sixties',
    '75+': 'over70',
    '75세 이상': 'over70',
  })[ageGroup] || ageGroup || 'fifties';
}

function resolveRange(range, ageGroup) {
  if (Array.isArray(range)) return range;
  if (!range) return null;
  const normalizedAgeGroup = getAgeGroup(ageGroup);
  return range[normalizedAgeGroup] || range.default || null;
}

export function getRange(test, gender, ageGroup) {
  if (gender === 'male') {
    const range = resolveRange(test.normalRange.male, ageGroup);
    if (range) return range;
  }
  if (gender === 'female') {
    const range = resolveRange(test.normalRange.female, ageGroup);
    if (range) return range;
  }
  return resolveRange(test.normalRange.default, ageGroup) || resolveRange(test.normalRange.male, ageGroup) || resolveRange(test.normalRange.female, ageGroup) || [null, null];
}

export function getRangeLabel(test, gender, ageGroup) {
  const [min, max] = getRange(test, gender, ageGroup);
  const basis = test.genderRequired ? (gender === 'female' ? '여성 기준' : '남성 기준') : '일반 기준';
  if (min === 0 && max != null) return `${max} ${test.unit} 이하 (${basis})`;
  if (test.reverse) return `${min} ${test.unit} 이상 (${basis})`;
  return `${min} ~ ${max} ${test.unit} (${basis})`;
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

export function classifyValue(test, value, gender, ageGroup) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (isRedFlag(test, num, gender)) return STATUS.RED;
  const [min, max] = getRange(test, gender, ageGroup);
  if (test.reverse) return num >= min ? STATUS.NORMAL : STATUS.LOW;
  if (min !== null && num < min) return STATUS.LOW;
  if (max !== null && num > max) return STATUS.HIGH;
  return STATUS.NORMAL;
}

export function classifyRecord(record) {
  return tests
    .map((test) => {
      const value = record?.values?.[test.id];
      const status = classifyValue(test, value, record?.gender, record?.ageGroup);
      if (!status) return null;
      return { test, value, status, rangeLabel: getRangeLabel(test, record?.gender, record?.ageGroup) };
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
