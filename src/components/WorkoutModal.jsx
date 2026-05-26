import { useState, useEffect, useRef } from 'react';

export default function WorkoutModal({ session: s, wkIdx, gymLog, onClose, onComplete, onSaveLog }) {
  const gs = s.gymSession;
  const [log, setLog] = useState(gymLog || {});
  const [timers, setTimers] = useState({});
  const [histEx, setHistEx] = useState(null);
  const timerRefs = useRef({});

  const saveField = (field, value) => {
    const newLog = { ...log, [field]: value };
    setLog(newLog);
    onSaveLog(wkIdx, s.id, field, value);
  };

  const completedCount = gs.exercises.filter((_, i) => log[`ex_${i}_done`]).length;
  const totalCount = gs.exercises.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSetInput = (exIdx, setIdx, field, value, restSecs) => {
    saveField(`ex_${exIdx}_s${setIdx}_${field}`, value);
    const newLog = { ...log, [`ex_${exIdx}_s${setIdx}_${field}`]: value };
    const kg   = field === 'kg'   ? value : newLog[`ex_${exIdx}_s${setIdx}_kg`]   || '';
    const reps = field === 'reps' ? value : newLog[`ex_${exIdx}_s${setIdx}_reps`] || '';
    if (kg && reps) {
      startTimer(exIdx, setIdx, restSecs);
      checkExComplete(exIdx, newLog);
    }
  };

  const checkExComplete = (exIdx, currentLog) => {
    const ex = gs.exercises[exIdx];
    const ps = parseInt(String(ex.sets)) || 3;
    let allDone = true;
    for (let si = 0; si < ps; si++) {
      if (!currentLog[`ex_${exIdx}_s${si}_kg`] || !currentLog[`ex_${exIdx}_s${si}_reps`]) { allDone = false; break; }
    }
    if (allDone && !currentLog[`ex_${exIdx}_done`]) {
      saveField(`ex_${exIdx}_done`, true);
    }
  };

  const startTimer = (exIdx, setIdx, total) => {
    const tid = `${exIdx}_${setIdx}`;
    if (timerRefs.current[tid]) { clearInterval(timerRefs.current[tid]); }
    setTimers(prev => ({ ...prev, [tid]: { rem: total, total, active: true, done: false } }));
    timerRefs.current[tid] = setInterval(() => {
      setTimers(prev => {
        const t = prev[tid];
        if (!t || t.rem <= 1) {
          clearInterval(timerRefs.current[tid]);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => setTimers(p => { const n = {...p}; delete n[tid]; return n; }), 3000);
          return { ...prev, [tid]: { ...t, rem: 0, active: false, done: true } };
        }
        return { ...prev, [tid]: { ...t, rem: t.rem - 1 } };
      });
    }, 1000);
  };

  const skipTimer = (exIdx, setIdx) => {
    const tid = `${exIdx}_${setIdx}`;
    if (timerRefs.current[tid]) clearInterval(timerRefs.current[tid]);
    setTimers(prev => { const n = {...prev}; delete n[tid]; return n; });
  };

  useEffect(() => () => { Object.values(timerRefs.current).forEach(clearInterval); }, []);

  const handleComplete = () => {
    const exercises = gs.exercises.map((ex, i) => {
      const ps = parseInt(String(ex.sets)) || 3;
      const sets = [];
      for (let si = 0; si < ps; si++) {
        const kg = log[`ex_${i}_s${si}_kg`] || '';
        const reps = log[`ex_${i}_s${si}_reps`] || '';
        if (kg || reps) sets.push({ set: si + 1, kg, reps });
      }
      const kgs = sets.map(s => parseFloat(s.kg) || 0).filter(Boolean);
      return { name: ex.name, sets: ps, reps: sets[0]?.reps || ex.reps, weight: kgs.length ? Math.max(...kgs) : 0, sets_detail: sets, notes: log[`ex_${i}_notes`] || '' };
    });
    onComplete(exercises);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:'20px 20px 0 0', width:'100%', maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 40px rgba(0,0,0,.6)' }}>
        {/* Header */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{s.name}</div>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', marginTop:2 }}>{gs.vest || ''}{gs.meWorkoutNumber ? ` · WO${gs.meWorkoutNumber}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', background:'var(--card)', border:'1px solid var(--border)', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer' }}>✕</button>
        </div>
        {/* Progress */}
        <div style={{ height:3, background:'var(--border)', flexShrink:0 }}>
          <div style={{ width:`${pct}%`, height:'100%', background:'var(--green)', transition:'width .4s ease' }}/>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          {gs.warmup && (
            <div style={{ padding:'10px 16px', background:'rgba(245,158,11,0.08)', borderBottom:'1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'#F59E0B', letterSpacing:3, marginBottom:3 }}>WARM UP</div>
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{gs.warmup}</div>
            </div>
          )}
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, padding:'8px 16px 5px', background:'var(--card)', borderBottom:'1px solid var(--border)' }}>
            💪 EXERCISES
          </div>

          {gs.exercises.map((ex, i) => {
            const isDone = !!log[`ex_${i}_done`];
            const ps = parseInt(String(ex.sets)) || 3;
            const restSecs = ex.rest ? (String(ex.rest).match(/(\d+)/)?.[1] || 90) : 90;
            return (
              <div key={i} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background: isDone ? 'rgba(0,196,106,0.06)' : 'transparent', transition:'background .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <button onClick={() => {
                    const newVal = !log[`ex_${i}_done`];
                    saveField(`ex_${i}_done`, newVal);
                  }} style={{
                    width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background: isDone ? 'var(--green)' : 'transparent',
                    border:`2px solid ${isDone ? 'var(--green)' : 'var(--border2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:700, color: isDone ? '#0A0A0A' : 'transparent',
                    cursor:'pointer', transition:'all .2s',
                  }}>✓</button>
                  <div style={{ fontWeight:700, fontSize:14, flex:1 }}>{ex.name}</div>
                </div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--muted)', padding:'5px 8px', background:'var(--card)', borderRadius:6, marginBottom:8 }}>
                  <span style={{ color:'var(--green)' }}>{ex.sets}×{ex.reps}</span> @ <span style={{ color:'var(--text)' }}>{ex.load}</span>{ex.rest ? ` · Rest ${ex.rest}` : ''}
                </div>
                {ex.coaching && (
                  <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.55, padding:'8px 10px', background:'rgba(0,196,106,0.06)', borderRadius:7, borderLeft:'2px solid var(--green)', marginBottom:8 }}>
                    {ex.coaching}
                  </div>
                )}

                {/* Sets */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 1fr', gap:5, marginBottom:4 }}>
                    {['', 'KG', 'REPS'].map((h, hi) => (
                      <div key={hi} style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:2 }}>{h}</div>
                    ))}
                  </div>
                  {Array.from({ length: ps }, (_, si) => {
                    const kv = log[`ex_${i}_s${si}_kg`] || '';
                    const rv = log[`ex_${i}_s${si}_reps`] || '';
                    const rowDone = kv && rv;
                    const tid = `${i}_${si}`;
                    const timer = timers[tid];
                    return (
                      <div key={si}>
                        <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 1fr', gap:5, marginBottom:4, alignItems:'center' }}>
                          <div style={{ fontFamily:'DM Mono,monospace', fontSize:13, fontWeight:700, color:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', height:38 }}>{si + 1}</div>
                          {['kg', 'reps'].map(field => (
                            <input key={field} type="number" min="0" step={field === 'kg' ? '0.5' : '1'}
                              placeholder={field}
                              defaultValue={field === 'kg' ? kv : rv}
                              onChange={e => handleSetInput(i, si, field, e.target.value, parseInt(restSecs))}
                              style={{
                                width:'100%', background: rowDone ? 'rgba(0,196,106,0.1)' : 'var(--card)',
                                border:`1.5px solid ${rowDone ? 'var(--green)' : 'var(--border)'}`,
                                borderRadius:8, color:'var(--text)', fontFamily:'DM Mono,monospace',
                                fontSize:15, padding:'8px 9px', height:38, textAlign:'center', outline:'none',
                              }}
                            />
                          ))}
                        </div>
                        {/* Rest timer between sets */}
                        {si < ps - 1 && timer && (
                          <div style={{
                            margin:'4px 0 8px', borderRadius:9, overflow:'hidden',
                            background:'var(--card)', border:`1.5px solid ${timer.done ? 'var(--green)' : 'var(--border)'}`,
                          }}>
                            <div style={{ height:4, background:'var(--green)', width: timer.done ? '0%' : `${(timer.rem / timer.total) * 100}%`, transition:'width 1s linear' }}/>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 13px' }}>
                              <div>
                                <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:2 }}>REST</div>
                                {timer.done
                                  ? <div style={{ fontFamily:'DM Mono,monospace', fontSize:13, color:'var(--green)', fontWeight:700, letterSpacing:2 }}>NEXT SET ⚡</div>
                                  : <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:20, color:'var(--green)' }}>{timer.rem}s</div>
                                }
                              </div>
                              {!timer.done && <button onClick={() => skipTimer(i, si)} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:7, padding:'5px 11px', fontSize:11, fontFamily:'DM Mono,monospace', color:'var(--muted)', cursor:'pointer' }}>Skip</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <textarea
                  placeholder="Notes…"
                  defaultValue={log[`ex_${i}_notes`] || ''}
                  onChange={e => saveField(`ex_${i}_notes`, e.target.value)}
                  style={{ width:'100%', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:7, color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:12, padding:'8px 10px', resize:'none', height:40, outline:'none' }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 16px calc(12px + env(safe-area-inset-bottom,0px))', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', textAlign:'center', marginBottom:8 }}>
            {completedCount} of {totalCount} exercises done
          </div>
          <button onClick={handleComplete} style={{
            width:'100%', borderRadius:12, padding:15, fontSize:15, fontWeight:800, letterSpacing:.3, cursor:'pointer', border:'none',
            background: completedCount === totalCount ? 'var(--green)' : 'var(--card)',
            color: completedCount === totalCount ? '#0A0A0A' : 'var(--muted)',
            transition:'all .2s',
          }}>
            {completedCount === totalCount ? '✓ Complete Workout' : `${completedCount}/${totalCount} done — keep going`}
          </button>
        </div>
      </div>
    </div>
  );
}
