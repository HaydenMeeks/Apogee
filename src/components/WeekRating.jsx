const RATINGS = [
  { val: 1, label: 'Too Easy',    color: '#3B82F6' },
  { val: 2, label: 'About Right', color: '#00C46A' },
  { val: 3, label: 'Too Hard',    color: '#EF4444' },
];

export default function WeekRating({ wkIdx, current, onChange }) {
  return (
    <div style={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 14px' }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(244,244,242,0.35)', letterSpacing: 3, marginBottom: 10 }}>RATE THIS WEEK</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {RATINGS.map(r => (
          <button key={r.val} onClick={() => onChange(wkIdx, r.val)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 9,
            background: current === r.val ? `${r.color}22` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${current === r.val ? r.color : 'rgba(255,255,255,0.08)'}`,
            color: current === r.val ? r.color : 'rgba(244,244,242,0.4)',
            fontSize: 11, fontWeight: current === r.val ? 700 : 500,
            cursor: 'pointer', transition: 'all .15s',
            fontFamily: 'DM Mono, monospace', letterSpacing: .5,
          }}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
