import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tests } from '../constants/tests';
import CustomKeypad from '../components/CustomKeypad';
import SlideCard from '../components/SlideCard';
import { detectUnitConfusion, getAgeGroup } from '../utils/classifier';
import { saveRecord as saveRecordToDB } from '../utils/db';

const ageGroups = [
  { value: 'under30', label: '30대 미만' },
  { value: 'thirties', label: '30-39세' },
  { value: 'forties', label: '40-49세' },
  { value: 'fifties', label: '50-59세' },
  { value: 'sixties', label: '60-69세' },
  { value: 'over70', label: '70세 이상' },
];
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (date) => date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1년 $2월 $3일');

export default function Input() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingRecord = location.state?.record;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('next');
  const [toast, setToast] = useState('');
  const [profile, setProfile] = useState({
    date: editingRecord?.date || today(),
    gender: editingRecord?.gender || '',
    ageGroup: editingRecord?.ageGroup ? getAgeGroup(editingRecord.ageGroup) : '',
  });
  const initialValues = useMemo(() => {
    const values = {};
    tests.forEach((t) => { values[t.id] = editingRecord?.values?.[t.id] != null ? String(editingRecord.values[t.id]) : ''; });
    return values;
  }, [editingRecord]);
  const [values, setValues] = useState(initialValues);

  const moveNext = () => { setDirection('next'); setStep((s) => Math.min(s + 1, tests.length + 2)); };
  const moveBack = () => { setDirection('back'); setStep((s) => Math.max(s - 1, 0)); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const saveRecord = async () => {
    if (!window.confirm(`검사일: ${formatDate(profile.date)} — 맞으신가요?`)) return;
    const parsedValues = {};
    tests.forEach((test) => { parsedValues[test.id] = values[test.id] === '' ? null : Number(values[test.id]); });
    const record = { date: profile.date, gender: profile.gender, ageGroup: getAgeGroup(profile.ageGroup), values: parsedValues };
    await saveRecordToDB(record);
    navigate('/result', { state: { record } });
  };

  const validateAndNext = async () => {
    const test = tests[step - 3];
    const raw = values[test.id];
    if (raw === '') return showToast('[건너뛰기] 버튼을 눌러 다음으로 넘어갈 수 있어요');
    const confusion = detectUnitConfusion(test.id, raw);
    if (confusion && !window.confirm(`${confusion}\n\n이 수치로 계속 저장할까요?`)) return;
    const num = Number(raw);
    if (num < test.allowedMin || num > test.allowedMax) {
      const ok = window.confirm(`입력하신 수치를 다시 확인해주세요\n\n${test.name}은 보통 ${test.allowedMin}~${test.allowedMax} 사이 값이에요.\n검사지를 다시 확인해주시겠어요?\n\n[확인] 이 수치로 저장 / [취소] 다시 입력`);
      if (!ok) return;
    }
    if (step === tests.length + 2) await saveRecord();
    else moveNext();
  };

  const skip = async () => {
    const test = tests[step - 3];
    setValues((prev) => ({ ...prev, [test.id]: '' }));
    if (step === tests.length + 2) await saveRecord();
    else moveNext();
  };

  let content;
  if (step === 0) content = (
    <div className="input-card"><h2>검사 받으신 날짜는 언제인가요?</h2><input className="date-input" type="date" value={profile.date} max={today()} onChange={(e) => setProfile({ ...profile, date: e.target.value })} /><button className="next-btn" onClick={moveNext}>다음으로 넘어가기</button></div>
  );
  else if (step === 1) content = (
    <div className="input-card"><h2>성별을 선택해주세요</h2><div className="two-grid"><button className={profile.gender === 'male' ? 'choice selected' : 'choice'} onClick={() => setProfile({ ...profile, gender:'male' })}>남성</button><button className={profile.gender === 'female' ? 'choice selected' : 'choice'} onClick={() => setProfile({ ...profile, gender:'female' })}>여성</button></div><button className="next-btn" onClick={() => profile.gender ? moveNext() : showToast('성별을 선택해주세요')}>다음으로 넘어가기</button></div>
  );
  else if (step === 2) content = (
    <div className="input-card"><h2>연령대를 선택해주세요</h2><div className="age-grid">{ageGroups.map((a) => <button key={a.value} className={profile.ageGroup === a.value ? 'choice selected' : 'choice'} onClick={() => setProfile({ ...profile, ageGroup:a.value })}>{a.label}</button>)}</div><button className="next-btn" onClick={() => profile.ageGroup ? moveNext() : showToast('연령대를 선택해주세요')}>다음으로 넘어가기</button></div>
  );
  else {
    const test = tests[step - 3];
    content = (
      <div className="input-card test-card">
        <h2>{test.name}</h2><p className="unit-text">단위: {test.unit}</p>
        <input className="number-display" readOnly value={values[test.id]} placeholder="수치 입력" />
        <CustomKeypad value={values[test.id]} onChange={(v) => setValues({ ...values, [test.id]: v })} allowDecimal={test.step === 0.1} />
        <button className="next-btn" onClick={validateAndNext}>{step === tests.length + 2 ? '저장하고 결과 보기' : '다음으로 넘어가기'}</button>
        <button className="skip-btn" onClick={skip}>건너뛰기</button>
      </div>
    );
  }

  return (
    <main className="page input-page">
      {step > 0 && <button className="back-btn" onClick={moveBack}>← 이전으로</button>}
      <SlideCard step={step} direction={direction}>{content}</SlideCard>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
