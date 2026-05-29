import { useNavigate } from 'react-router-dom';

export default function Main() {
  const navigate = useNavigate();

  return (
    <main className="page main-menu-page">
      <section className="main-menu-actions">
        <button className="main-new-button" onClick={() => navigate('/input')}>새 검사결과 입력하기</button>
        <div>
          <button className="main-history-button" onClick={() => navigate('/history')}>지난 기록 보기</button>
          <p className="main-storage-warning">
            앱의 저장공간에 문제가 생길 시<br />
            오래된 기록이 사라질 수 있습니다.
          </p>
        </div>
      </section>
      <footer className="main-disclaimer">
        본 앱은 의료 진단 및 치료 목적이 아니며,<br />
        정확한 의학적 판단은 반드시 의사와 상담하십시오
      </footer>
    </main>
  );
}
