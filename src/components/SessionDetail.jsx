import { useState, useRef, useEffect } from 'react';
import { SESSION_TYPES, minsToHMM, hmmToMins } from '../utils.js';
import WorkoutModal from './WorkoutModal.jsx';

export default function SessionDetail({ session: s, wkIdx, plan, completion, gymLog, onBack, onTick, onUntick, onCompleteWorkout, onSaveGymLog }) {
  const [noteOpen, setNoteOpen]     = useState(false);
  const [timeVal, setTimeVal]       = useState(hmmToMins(completion?.time || ''));
  const [distVal, setDistVal]       = useState(completion?.dist || '');
  const [notesVal, setNotesVal]     = useState(completion?.notes || '');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [justDone, setJustDone]     = useState(false);
  const isDone = completion?.done;
  const tc = SESSION_TYPES[s.type] || SESSION_TYPES.easy;
  const isRun = !s.isGym && s.type !== 'rest';
  const isGym = s.isGym;
  const isRace = s.type === 'race';

  const handleTick = () => {
    const data = {
      time: minsToHMM(timeVal),
      dist: distVal,
      notes: notesVal,
    };
    onTick(wkIdx, s.id, data);
    setJustDone(true);
    setTimeout(() => setJustDone(false), 1500);
  };

  const handleUntick = () => {
    onUntick(wkIdx, s.id);
  };

  const handleGymComplete = (exercises) => {
    onCompleteWorkout(wkIdx, s.id, exercises);
    setWorkoutOpen(false);
    setJustDone(true);
    setTimeout(() => setJustDone(false), 1500);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* ── HERO ── */}
      <div style={{
        background: tc.bg,
        borderBottom: `1px solid ${tc.color}22`,
        position:'relative', overflow:'hidden',
        padding:'0 0 24px',
      }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 20px' }}>
          <button onClick={onBack} style={{
            display:'flex', alignItems:'center', gap:6,
            background:'rgba(0,0,0,0.3)', border:'1px solid var(--border)',
            borderRadius:20, padding:'6px 12px 6px 8px',
            color:'var(--text)', fontSize:13, fontWeight:500, cursor:'pointer',
          }}>
            <span style={{ fontSize:16 }}>←</span> Week {wkIdx + 1}
          </button>
          {isDone && (
            <div style={{ background:'var(--green)', color:'#0A0A0A', borderRadius:20, padding:'5px 12px', fontSize:11, fontFamily:'DM Mono,monospace', fontWeight:700, letterSpacing:1 }}>
              ✓ DONE
            </div>
          )}
        </div>

        {/* Type icon + session name */}
        <div style={{ padding:'0 20px' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>{tc.icon}</div>
          <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:28, lineHeight:1.1, letterSpacing:'-.5px', color:'var(--text)', marginBottom:6 }}>
            {s.name}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            <Pill color={tc.color} bg={tc.bg}>{tc.label}</Pill>
            <Pill color={s.hard ? 'var(--race)' : 'var(--green)'} bg={s.hard ? 'var(--race-d)' : 'var(--gd)'}>
              {s.hard ? 'HARD' : 'EASY'}
            </Pill>
            {isGym && <Pill color="var(--gym)" bg="var(--gym-d)">GYM</Pill>}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:'flex', gap:8, padding:'0 16px', overflowX:'auto', scrollbarWidth:'none' }}>
          <StatCard label="DURATION" value={s.target.split('·')[0].trim()}/>
          {s.target.includes('HR') && (
            <StatCard label="HR CAP" value={s.target.match(/HR[^·]*/)?.[0]?.replace('HR','').replace('cap','').trim() || '—'}/>
          )}
          {plan && <StatCard label="PHASE" value={plan.weeks[wkIdx]?.phase?.split('·').pop().trim().substring(0,20) || '—'}/>}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, padding:'16px 16px 120px', overflowY:'auto' }}>

        {/* Coach note — collapsed */}
        <CoachNote note={s.focus} open={noteOpen} onToggle={() => setNoteOpen(!noteOpen)}/>

        {/* Gym workout preview */}
        {isGym && s.gymSession?.exercises && (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--gym)', letterSpacing:3, marginBottom:10, fontWeight:700 }}>
              PRESCRIBED EXERCISES
            </div>
            {s.gymSession.exercises.slice(0, 5).map((ex, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom: i < Math.min(s.gymSession.exercises.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{ex.name}</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)' }}>
                  <span style={{ color:'var(--green)' }}>{ex.sets}×{ex.reps}</span> @ {ex.load}{ex.rest ? ` · Rest ${ex.rest}` : ''}
                </div>
              </div>
            ))}
            {s.gymSession.exercises.length > 5 && (
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', marginTop:8 }}>
                +{s.gymSession.exercises.length - 5} more exercises
              </div>
            )}
          </div>
        )}

        {/* Run log inputs */}
        {isRun && !isDone && (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:3, marginBottom:10 }}>LOG THIS SESSION</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <LogInput label="TIME (min)" type="number" placeholder="60" value={timeVal} onChange={setTimeVal}/>
              <LogInput label="DISTANCE (km)" type="number" placeholder="—" value={distVal} onChange={setDistVal} step="0.1"/>
            </div>
            <LogInput label="NOTES" placeholder="How did it feel?" value={notesVal} onChange={setNotesVal} multiline/>
          </div>
        )}

        {/* Done summary */}
        {isDone && !isGym && (completion?.time || completion?.dist || completion?.notes) && (
          <div style={{ background:'var(--card)', border:'1px solid var(--green)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, marginBottom:8 }}>LOGGED</div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom: completion?.notes ? 8 : 0 }}>
              {completion.time && <div><div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:20, color:'var(--text)' }}>{completion.time}</div><div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)' }}>TIME</div></div>}
              {completion.dist && parseFloat(completion.dist) > 0 && <div><div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:20, color:'var(--text)' }}>{parseFloat(completion.dist).toFixed(1)}km</div><div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)' }}>DISTANCE</div></div>}
            </div>
            {completion.notes && <div style={{ fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>"{completion.notes}"</div>}
            <button onClick={handleUntick} style={{ marginTop:10, background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'7px 12px', fontSize:11, fontFamily:'DM Mono,monospace', color:'var(--muted)', cursor:'pointer', letterSpacing:1 }}>
              ↺ MARK INCOMPLETE
            </button>
          </div>
        )}
      </div>

      {/* ── STICKY CTA ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        padding:'12px 16px calc(12px + env(safe-area-inset-bottom,0px))',
        background:'rgba(10,10,10,0.95)', borderTop:'1px solid var(--border)',
        backdropFilter:'blur(12px)',
        display:'flex', gap:8,
      }}>
        {isGym && !isDone && (
          <button onClick={() => setWorkoutOpen(true)} style={{
            flex:1, background:'var(--green)', color:'#0A0A0A',
            border:'none', borderRadius:12, padding:16,
            fontSize:15, fontWeight:800, letterSpacing:.3, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            🏋️ Begin Workout
          </button>
        )}
        {isGym && isDone && (
          <button onClick={handleUntick} style={{
            flex:1, background:'var(--card)', color:'var(--muted)',
            border:'1px solid var(--border)', borderRadius:12, padding:16,
            fontSize:13, fontWeight:600, cursor:'pointer',
          }}>
            ↺ Mark Incomplete
          </button>
        )}
        {!isGym && !isDone && (
          <button onClick={handleTick} style={{
            flex:1,
            background: justDone ? 'var(--g2)' : 'var(--green)',
            color:'#0A0A0A', border:'none', borderRadius:12, padding:16,
            fontSize:15, fontWeight:800, letterSpacing:.3, cursor:'pointer',
            transition:'background .3s',
          }}>
            {justDone ? '✓ Done!' : '✓ Mark Complete'}
          </button>
        )}
        {!isGym && isDone && (
          <button onClick={handleUntick} style={{
            background:'var(--card)', color:'var(--muted)',
            border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px',
            fontSize:13, fontWeight:600, cursor:'pointer',
          }}>
            ↺
          </button>
        )}
        {!isGym && isDone && (
          <button onClick={handleTick} style={{
            flex:1, background:'var(--card)', color:'var(--text)',
            border:'1px solid var(--green)', borderRadius:12, padding:16,
            fontSize:14, fontWeight:700, cursor:'pointer',
          }}>
            Update Log
          </button>
        )}
      </div>

      {/* Gym workout modal */}
      {workoutOpen && (
        <WorkoutModal
          session={s}
          wkIdx={wkIdx}
          gymLog={gymLog}
          onClose={() => setWorkoutOpen(false)}
          onComplete={handleGymComplete}
          onSaveLog={onSaveGymLog}
          history={[]}
        />
      )}
    </div>
  );
}

function Pill({ color, bg, children }) {
  return (
    <span style={{ fontSize:10, fontFamily:'DM Mono,monospace', padding:'3px 8px', borderRadius:5, background: bg, color, fontWeight:700, letterSpacing:1 }}>
      {children}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background:'rgba(0,0,0,0.3)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 12px', flexShrink:0, minWidth:100 }}>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:'var(--muted)', letterSpacing:2, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'-.2px' }}>{value}</div>
    </div>
  );
}

function CoachNote({ note, open, onToggle }) {
  if (!note) return null;
  const lines = note.split('\n').filter(Boolean);
  const preview = lines[0]?.slice(0, 100) || '';
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderLeft:'2px solid var(--green)', borderRadius:12, marginBottom:12, overflow:'hidden' }}>
      <button onClick={onToggle} style={{
        width:'100%', padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10,
        background:'transparent', border:'none', cursor:'pointer', textAlign:'left',
      }}>
        <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, fontWeight:700, flexShrink:0, marginTop:1 }}>COACH</span>
        <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, flex:1 }}>
          {open ? note : preview + (note.length > 100 ? '…' : '')}
        </span>
        <span style={{ color:'var(--muted)', fontSize:12, marginTop:1, flexShrink:0, transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>▾</span>
      </button>
    </div>
  );
}

function LogInput({ label, value, onChange, type = 'text', placeholder, step, multiline }) {
  const style = {
    width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)',
    borderRadius:8, color:'var(--text)', fontFamily:'DM Mono,monospace',
    fontSize:14, padding:'9px 11px', outline:'none',
    transition:'border-color .15s',
  };
  return (
    <div>
      <label style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:2, display:'block', marginBottom:4 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, resize:'none', height:44, fontSize:12, fontFamily:'DM Sans,sans-serif' }} onFocus={e => e.target.style.borderColor='var(--green)'} onBlur={e => e.target.style.borderColor='var(--border)'}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step={step} style={style} onFocus={e => e.target.style.borderColor='var(--green)'} onBlur={e => e.target.style.borderColor='var(--border)'}/>
      }
    </div>
  );
}
