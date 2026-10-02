export function gradeFor(complexity = '') {
  const c = String(complexity).replace(/\s/g, '');
  if (/O\(1\)|O\(log/.test(c)) return 'green';
  if (/O\(n\)|O\(nlogn\)|O\(V\+E\)/.test(c)) return 'blue';
  if (/O\(n\^2\)|O\(n\^3\)|O\(n\^k\)|O\(n\*|O\(nW\)/.test(c)) return 'amber';
  if (/O\(2|O\(n!\)|O\(\d/.test(c)) return 'red';
  return 'plain';
}

export default function ComplexityBadge({ label = 'Time', value, className = '' }) {
  const grade = value ? gradeFor(value) : 'plain';
  return (
    <span className={`cu-badge cu-badge-${grade} ${className}`}>
      {label && <span style={{ opacity: 0.75, fontWeight: 550 }}>{label}</span>}
      <span className="mono">{value || '—'}</span>
    </span>
  );
}
