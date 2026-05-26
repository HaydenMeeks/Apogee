import { getCurWk, daysTo } from '../utils.js';
import Heatmap from './Heatmap.jsx';

export default function OverviewTab({ plan, completions }) {
  if (!plan) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>Load a plan to see the overview.</div>
      </div>
    );
  }

  const curWk = getCurWk(plan);
  const totalS = plan.weeks.reduce((a, w) => a + w.sessions.length, 0);
  const doneS = Object.values(completions).filter(c => c?.done).length;
  const totalHrs = plan.weeks.reduce((a, w) => a + (w.targets?.hrs || 0), 0);
  const start = new Date(plan.meta.startDate);
  const races = plan.meta.races || [];

  // Build km data
  const wkData = plan.weeks.map((w, idx) => {
    const gymHrs = w.sessions.filter(s => s.isGym).reduce((a, s) => a + (s.hrs || 0), 0);
    const aetHrs = w.sessions.filter(s => s.name?.includes('AeT Retest')).reduce((a, s) => a + (s.hrs || 0), 0);
    const runHrs = Math.max(0, (w.targets?.hrs || 0) - gymHrs - aetHrs);
    const raceKm = w.sessions.filter(s => s.type === 'race').reduce((a, s) => a + (s.km || 0), 0);
    const km = Math.round(runHrs * 10.5) + raceKm;
    const ws = new Date(start.getTime() + idx * 7 * 86400000);
    return {
      wk: w.week, km,
      hasRace: w.sessions.some(s => s.type === 'race'),
      hasAet: w.sessions.some(s => s.name?.includes('AeT Retest')),
      phase: w.phase || '', hrs: w.targets?.hrs || 0,
      date: ws.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      isCur: idx === curWk,
    };
  });
  const maxKm = Math.max(...wkData.map(d => d.km), 50);

  // Phases
  const phases = {};
  plan.weeks.forEach(w => {
    const ph = (w.phase || '').split('·')[0].trim() || 'Other';
    if (!phases[ph]) phases[ph] = { weeks: 0, hrs: 0 };
    phases[ph].weeks++;
    phases[ph].hrs += (w.targets?.hrs || 0);
  });

  return (
    <div style={{ padding:'16px 0 24px' }}>
      <div style={{ padding:'0 14px' }}>

        {/* Race countdowns */}
        {races.length >= 2 && (
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {races.map((r, i) => (
              <div key={i} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'11px 12px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${i===0?'var(--easy)':'var(--race)'},transparent)` }}/>
                <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:26, color: i===0?'var(--easy)':'var(--race)', lineHeight:1 }}>{daysTo(r.date)}</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:1, marginTop:2 }}>{r.name.split('·')[0].trim()}</div>
                {r.goal && <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color: i===0?'var(--easy)':'var(--race)', marginTop:1 }}>{r.goal}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Block stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          {[
            { val: plan.weeks.length, lbl: 'WEEKS' },
            { val: Math.round(totalHrs), lbl: 'HRS PLANNED' },
            { val: `${doneS}/${totalS}`, lbl: 'SESSIONS' },
          ].map((k, i) => (
            <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 11px' }}>
              <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:22, color:'var(--green)', lineHeight:1 }}>{k.val}</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:'var(--muted)', letterSpacing:.5, marginTop:3 }}>{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <Heatmap plan={plan} completions={completions}/>

        {/* Volume chart — lightweight bar rows */}
        <SectionLabel>Weekly Volume</SectionLabel>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
          {wkData.map((d, i) => (
            <div key={i} style={{
              padding:'7px 12px',
              borderBottom: i < wkData.length - 1 ? '1px solid var(--border)' : 'none',
              background: d.isCur ? 'var(--gd)' : 'transparent',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color: d.isCur ? 'var(--green)' : 'var(--muted)' }}>
                    WK{d.wk} {d.date}
                  </span>
                  {d.hasRace && <Badge color="var(--race)" bg="var(--race-d)">RACE</Badge>}
                  {d.hasAet && <Badge color="var(--green)" bg="var(--gd)">AeT</Badge>}
                  {d.isCur && <Badge color="var(--green)" bg="var(--gd)">NOW</Badge>}
                </div>
                <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, fontWeight:700, color: d.hasRace ? 'var(--race)' : d.isCur ? 'var(--green)' : 'var(--text)' }}>
                  {d.km}km
                </span>
              </div>
              <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{
                  width:`${Math.round((d.km / maxKm) * 100)}%`,
                  height:'100%',
                  background: d.hasRace ? 'var(--race)' : d.hasAet ? 'var(--green)' : d.isCur ? 'var(--green)' : 'var(--easy)',
                  borderRadius:2, opacity: d.isCur ? 1 : 0.6,
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* AeT retest schedule */}
        {plan.meta.aet_retest_schedule && <>
          <SectionLabel>AeT Retest Schedule</SectionLabel>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:14 }}>
            {plan.meta.aet_retest_schedule.map((t, i, arr) => {
              const ws = new Date(start.getTime() + (t.week - 1) * 7 * 86400000);
              const isPast = ws < new Date();
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: isPast ? 'var(--border2)' : 'var(--green)', flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>Week {t.week} · {ws.toLocaleDateString('en-AU', { day:'numeric', month:'short' })}</div>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', marginTop:1 }}>{t.note}</div>
                  </div>
                  <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color: isPast ? 'var(--muted)' : 'var(--green)', letterSpacing:1 }}>
                    {isPast ? 'DONE' : 'UPCOMING'}
                  </span>
                </div>
              );
            })}
          </div>
        </>}

        {/* Phase breakdown */}
        <SectionLabel>Phase Breakdown</SectionLabel>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          {Object.entries(phases).map(([ph, stats], i, arr) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 13px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{ph}</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', letterSpacing:1 }}>
                {stats.weeks} WKS · {Math.round(stats.hrs)}HRS
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, fontWeight:700, marginBottom:7, paddingLeft:2 }}>{children}</div>;
}
function Badge({ color, bg, children }) {
  return <span style={{ fontSize:8, fontFamily:'DM Mono,monospace', background:bg, color, padding:'1px 5px', borderRadius:3, fontWeight:700, letterSpacing:1 }}>{children}</span>;
}
