import { tests } from '../constants/tests';
import { getRange } from './classifier';

function isNormalValue(test, value, gender, ageGroup) {
  const [min, max] = getRange(test, gender, ageGroup);
  if (test.reverse) return min == null || value >= min;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function getStableThreshold(test, gender, ageGroup, previousValue) {
  const [min, max] = getRange(test, gender, ageGroup);
  if (min != null && max != null) return Math.abs(max - min) * 0.05;
  return Math.abs(previousValue) * 0.05;
}

function getTrendMessage(trend, test, count, isLatestNormal) {
  if (trend === 'insufficient') return null;
  if (test.reverse && trend === 'rising') return `최근 ${count}회 ${test.name}이 올라가고 있어요 — 좋은 신호예요!`;
  if (test.reverse && trend === 'falling') return `최근 ${count}회 ${test.name}이 내려가고 있어요. 다음 검진 시 확인해보세요.`;
  if (trend === 'rising' && isLatestNormal) return `최근 ${count}회 ${test.name}이 조금씩 올라가고 있어요.`;
  if (trend === 'rising') return `최근 ${count}회 ${test.name}이 계속 올라가고 있어요. 다음 검진 시 확인해보세요.`;
  if (trend === 'falling' && isLatestNormal) return `최근 ${count}회 ${test.name}이 조금씩 내려가고 있어요.`;
  if (trend === 'falling') return `최근 ${count}회 ${test.name}이 계속 내려가고 있어요. 다음 검진 시 확인해보세요.`;
  if (trend === 'stable') return `최근 ${test.name} 수치가 안정적으로 유지되고 있어요.`;
  return `최근 ${test.name} 수치가 오르내리고 있어요.`;
}

export function analyzeTrend(records, indicatorId, gender, ageGroup) {
  const test = tests.find((item) => item.id === indicatorId);
  if (!test) return { trend: 'insufficient', message: null, count: 0 };

  const values = records
    .filter((record) => record?.values?.[indicatorId] !== null && record?.values?.[indicatorId] !== undefined)
    .map((record) => ({
      value: Number(record.values[indicatorId]),
      gender: record.gender || gender,
      ageGroup: record.ageGroup || ageGroup,
    }))
    .filter((record) => !Number.isNaN(record.value))
    .slice(-3);

  const count = values.length;
  if (count < 2) return { trend: 'insufficient', message: null, count };

  const latest = values[count - 1];
  const previous = values[count - 2];
  const first = values[count - 3];
  const threshold = getStableThreshold(test, latest.gender, latest.ageGroup, previous.value);
  let trend = 'mixed';

  if (count >= 3 && latest.value > previous.value && previous.value > first.value) {
    trend = 'rising';
  } else if (count >= 3 && latest.value < previous.value && previous.value < first.value) {
    trend = 'falling';
  } else if (Math.abs(latest.value - previous.value) <= threshold) {
    trend = 'stable';
  }

  const isLatestNormal = isNormalValue(test, latest.value, latest.gender, latest.ageGroup);
  return {
    trend,
    message: getTrendMessage(trend, test, count, isLatestNormal),
    count,
  };
}
