import { getStatusText } from '../utils/classifier';

const badgeMap = {
  normal: { icon: '●', className: 'badge-normal' },
  high: { icon: '▲', className: 'badge-warn' },
  low: { icon: '▼', className: 'badge-warn' },
  redFlag: { icon: '■', className: 'badge-red' },
};

export default function StatusBadge({ status }) {
  const item = badgeMap[status] || badgeMap.normal;
  return <span className={`status-badge ${item.className}`}>{item.icon} {getStatusText(status)}</span>;
}
