import { useRef, useState } from 'react';
import { getAllRecords, saveRecord } from '../utils/db';

function getBackupFileName() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `blood-test-backup-${stamp}.json`;
}

function isValidRecord(record) {
  return (
    record &&
    Object.prototype.hasOwnProperty.call(record, 'date') &&
    Object.prototype.hasOwnProperty.call(record, 'gender') &&
    Object.prototype.hasOwnProperty.call(record, 'ageGroup') &&
    Object.prototype.hasOwnProperty.call(record, 'values')
  );
}

function canShareFile(file) {
  return Boolean(navigator.share && navigator.canShare?.({ files: [file] }));
}

export default function BackupRestore({ onRestored }) {
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState('');
  const [shareFile, setShareFile] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  };

  const exportJson = async () => {
    const records = await getAllRecords();
    if (records.length === 0) {
      showToast('저장된 기록이 없어요');
      setShareFile(null);
      return;
    }

    const json = JSON.stringify(records, null, 2);
    const file = new File([json], getBackupFileName(), { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setShareFile(canShareFile(file) ? file : null);
  };

  const shareJson = async () => {
    if (!shareFile) return;

    try {
      await navigator.share({
        title: '혈액검사 기록 백업',
        files: [shareFile],
      });
    } catch (error) {
      if (error.name !== 'AbortError') showToast('공유하지 못했어요');
    }
  };

  const importJson = () => {
    fileInputRef.current?.click();
  };

  const restoreFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const records = JSON.parse(await file.text());
      if (!Array.isArray(records) || !records.every(isValidRecord)) {
        showToast('올바른 백업 파일이 아니에요');
        return;
      }

      const ok = window.confirm(
        `백업 파일에 ${records.length}개의 기록이 있어요.\n현재 기록과 합쳐서 저장할까요?\n(같은 날짜는 백업 파일 기준으로 덮어쓰기)`
      );
      if (!ok) return;

      await Promise.all(records.map((record) => saveRecord(record)));
      await onRestored?.();
      showToast(`${records.length}개의 기록을 복원했어요`);
    } catch (error) {
      showToast('올바른 백업 파일이 아니에요');
    }
  };

  return (
    <section className="backup-restore">
      <button className="backup-button export" onClick={exportJson}>📥 전체 기록 백업 (JSON)</button>
      <button className="backup-button import" onClick={importJson}>📤 백업 파일 복원</button>
      {shareFile && <button className="backup-share-button" onClick={shareJson}>공유하기</button>}
      <input ref={fileInputRef} className="backup-file-input" type="file" accept=".json" onChange={restoreFile} />
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
