import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import BackupRestore from '../components/BackupRestore';
import { tests } from '../constants/tests';
import { classifyRecord, getRange } from '../utils/classifier';
import { deleteRecord as deleteRecordFromDB, getAllRecords } from '../utils/db';
import { analyzeTrend } from '../utils/trendAnalyzer';

const trendIcons = {
  rising: '📈',
  falling: '📉',
  stable: '➡️',
  mixed: '〰️',
};

function bandPlugin(test, gender, ageGroup) {
  return {
    id: 'normalBand',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !test) return;
      const [min, max] = getRange(test, gender, ageGroup);
      ctx.save();
      if (test.reverse) {
        const y = scales.y.getPixelForValue(min);
        ctx.setLineDash([6, 6]); ctx.strokeStyle = '#EF5350'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
      } else {
        const yMin = scales.y.getPixelForValue(min);
        const yMax = scales.y.getPixelForValue(max);
        ctx.fillStyle = 'rgba(76,175,80,0.13)';
        ctx.fillRect(chartArea.left, yMax, chartArea.right - chartArea.left, yMin - yMax);
      }
      const high = test.redFlag?.high || (gender === 'male' ? test.redFlag?.maleHigh : test.redFlag?.femaleHigh);
      if (high) {
        const y = scales.y.getPixelForValue(high);
        ctx.setLineDash([8, 6]); ctx.strokeStyle = '#D32F2F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
      }
      ctx.restore();
    },
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save(); ctx.font = '12px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((point, i) => ctx.fillText(`${chart.data.datasets[0].data[i]}`, point.x, point.y - 12));
      ctx.restore();
    }
  };
}

export default function History() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  const loadRecords = useCallback(async () => {
    setRecords(await getAllRecords());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
  const availableTests = useMemo(() => tests.filter((t) => records.some((r) => r.values?.[t.id] != null)), [records]);
  useEffect(() => { if (!selectedId && availableTests[0]) setSelectedId(availableTests[0].id); }, [availableTests, selectedId]);
  const selectedTest = tests.find((t) => t.id === selectedId);
  const selectedRows = useMemo(() => records.filter((r) => r.values?.[selectedId] != null), [records, selectedId]);
  const latestSelectedRow = selectedRows.at(-1);
  const trendSummary = useMemo(
    () => analyzeTrend(records, selectedId, latestSelectedRow?.gender, latestSelectedRow?.ageGroup),
    [records, selectedId, latestSelectedRow]
  );

  useEffect(() => {
    if (!canvasRef.current || records.length < 2 || !selectedTest) return;
    const dataRows = selectedRows;
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: dataRows.map((r) => r.date), datasets: [{ label: selectedTest.name, data: dataRows.map((r) => r.values[selectedTest.id]), borderWidth: 3, pointRadius: 6, tension: 0.2 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:false } } },
      plugins: [bandPlugin(selectedTest, dataRows[0]?.gender, dataRows[0]?.ageGroup)]
    });
    return () => chart.destroy();
  }, [records, selectedRows, selectedTest]);

  const deleteRecord = async (index) => {
    if (!window.confirm(`${records[index].date} 기록을 지울까요?\n이 작업은 되돌릴 수 없어요.`)) return;
    await deleteRecordFromDB(records[index].date);
    const next = records.filter((_, i) => i !== index);
    setRecords(next);
  };

  const exportCsv = () => {
    const rows = ['Date,Indicator,Value,Unit'];
    records.forEach((r) => tests.forEach((t) => { if (r.values?.[t.id] != null) rows.push(`${r.date},${t.name},${r.values[t.id]},${t.unit}`); }));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'blood-test-records.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (records.length === 0) return <main className="page history-page"><h1>지난 기록 보기</h1><BackupRestore onRestored={loadRecords} /><section className="empty-page inline-empty"><div className="empty-icon">📋</div><h2>아직 저장된 검사 기록이 없어요</h2><button className="primary-big" onClick={() => navigate('/input')}>새 검사결과 입력하기</button></section></main>;

  return (
    <main className="page history-page">
      <h1>지난 기록 보기</h1>
      <BackupRestore onRestored={loadRecords} />
      {records.length === 1 ? <p className="muted">다음 검사 결과가 입력되면 변화를 보여드릴게요</p> : <><div className="tab-row">{availableTests.map((t) => <button className={selectedId === t.id ? 'tab active' : 'tab'} key={t.id} onClick={() => setSelectedId(t.id)}>{t.name}</button>)}</div>{trendSummary.message && <div className="trend-summary"><span className="trend-icon">{trendIcons[trendSummary.trend]}</span><p>{trendSummary.message}</p></div>}<div className="chart-scroll"><div className="chart-wrap"><canvas ref={canvasRef} /></div></div></>}
      <section className="record-list">{records.map((record, index) => { const summary = classifyRecord(record).slice(0, 3); return <article key={`${record.date}-${index}`} className="record-card"><h3>{record.date}</h3><p>{summary.map((s) => `${s.test.name} ${s.value}${s.test.unit}`).join(' · ') || '입력된 수치 없음'}</p><div className="record-actions"><button onClick={() => navigate('/input', { state: { record } })}>이 기록 수정하기</button><button onClick={() => deleteRecord(index)}>이 기록 삭제하기</button></div></article>; })}</section>
      <button className="secondary" onClick={exportCsv}>전체 기록 내보내기</button>
    </main>
  );
}
