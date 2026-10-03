export function gradeFor(complexity = '') {
  const sanitized = String(complexity).replace(/\s/g, '');
  if (/O\(1\)|O\(log/.test(sanitized)) return 'green';
  if (/O\(n\)|O\(nlogn\)|O\(V\+E\)/.test(sanitized)) return 'blue';
  if (/O\(n\^2\)|O\(n\^3\)|O\(n\^k\)|O\(n\*|O\(nW\)/.test(sanitized)) return 'amber';
  if (/O\(2|O\(n!\)|O\(\d/.test(sanitized)) return 'red';
  return 'plain';
}

export default function ComplexityBadge({ label = 'Time', value, className = '' }) {
  const colorGrade = value ? gradeFor(value) : 'plain';
  return (
    <span className={`badge badge-${colorGrade} ${className}`}>
      {label && <span style={{ opacity: 0.75, fontWeight: 550 }}>{label}</span>}
      <span className="mono">{value || '—'}</span>
    </span>
  );
}
