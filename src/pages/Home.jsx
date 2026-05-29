import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-logo-box" aria-hidden="true">🩸</div>
        <h1 className="home-title">P-eedback</h1>
      </section>

      <section className="home-actions">
        <button className="home-start-button" onClick={() => navigate('/input')}>시작하기</button>
        <button className="home-history-button" onClick={() => navigate('/history')}>지난 기록 보기</button>
      </section>

      <footer className="home-disclaimer">
        본 앱은 의료 진단 및 치료 목적이 아니며,<br />
        정확한 의학적 판단은 반드시 의사와 상담하십시오
      </footer>
    </main>
  );
}
