import StatusBadge from './StatusBadge';

export default function ResultCard({ item }) {
  const { test, value, status, rangeLabel } = item;
  return (
    <article className={`result-card card-${status}`}>
      <StatusBadge status={status} />
      <h3>{test.name}</h3>
      <div className="my-value">{value} <span>{test.unit}</span></div>
      <p className="range-text">정상범위: {rangeLabel}</p>
      <hr />
      <p className="card-desc">{test.descriptions[status]}</p>
      <p className="plain-text">{test.plainExplanation}</p>
      {status === 'redFlag' && <div className="red-note">이 수치는 빠른 시일 내 진료를 권하는 범위예요.</div>}
    </article>
  );
}
