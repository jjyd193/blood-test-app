import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [hasRecords, setHasRecords] = useState(false);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('records') || '[]');
    setHasRecords(records.length > 0);
  }, []);

  return (
    <main className="page home-page">
      <section className="home-content">
        <h1>내 혈액검사 결과</h1>
        <p className="subtitle">수치를 입력하면 쉽게 해석해드려요</p>
        <div className="spacer-40" />
        <button className="primary-big" onClick={() => navigate('/input')}>새 검사결과 입력하기</button>
        <div className="spacer-16" />
        <button className="secondary-big" onClick={() => navigate('/history')}>지난 기록 보기</button>
        {hasRecords && <div className="ios-warning">앱을 오래 열지 않으면 기록이 사라질 수 있어요. 자주 확인해주세요.</div>}
      </section>
      <footer className="fixed-disclaimer">본 앱은 의료 진단 목적이 아닙니다. 정확한 판단은 반드시 의사와 상담하십시오.</footer>
    </main>
  );
}
