import { useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import ResultCard from '../components/ResultCard';
import { classifyRecord, getStatusOrder } from '../utils/classifier';

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const captureRef = useRef(null);
  const record = location.state?.record || JSON.parse(localStorage.getItem('records') || '[]').at(-1);
  const items = useMemo(() => record ? classifyRecord(record).sort((a, b) => getStatusOrder(a.status) - getStatusOrder(b.status)) : [], [record]);
  const counts = items.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), { normal:0, high:0, low:0, redFlag:0 });
  const redItems = items.filter((i) => i.status === 'redFlag');

  const savePng = async () => {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `blood-test-${record.date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!record) return <main className="page"><p>표시할 결과가 없어요.</p><button className="primary-big" onClick={() => navigate('/input')}>새 검사결과 입력하기</button></main>;

  return (
    <main className="page result-page">
      <div ref={captureRef} className="capture-area">
        {redItems.length > 0 && <section className="red-section"><h2>꼭 확인하세요</h2>{redItems.map(({ test, value }) => <p key={test.id}>■ {test.name}: {value} {test.unit}</p>)}</section>}
        <section className="summary-grid">
          <div className="summary-box normal"><strong>{counts.normal}</strong><span>정상</span></div>
          <div className="summary-box warn"><strong>{counts.high}</strong><span>다소 높음</span></div>
          <div className="summary-box warn"><strong>{counts.low}</strong><span>다소 낮음</span></div>
          <div className="summary-box red"><strong>{counts.redFlag}</strong><span>병원 상담 권장</span></div>
        </section>
        <section>{items.map((item) => <ResultCard key={item.test.id} item={item} />)}</section>
      </div>
      <section className="bottom-buttons"><button className="primary" onClick={savePng}>결과 PNG로 저장</button><button className="secondary" onClick={() => navigate('/history')}>추이 보기</button><button className="secondary" onClick={() => navigate('/')}>처음으로</button></section>
      <footer className="fixed-disclaimer two-line">본 앱은 의료 진단 목적이 아닙니다.<br />이 앱은 각 항목을 따로따로 해석해요. 종합 판단은 의사 선생님께 맡겨주세요.</footer>
    </main>
  );
}
