import { useState } from 'react';
import { wkRange, getCurWk, SESSION_TYPES } from '../utils.js';
import SessionDetail from './SessionDetail.jsx';
import WeekRating from './WeekRating.jsx';

export default function PlanTab({ plan, completions, gymLogs, curWk, setCurWk, tickSession, untickSession, completeWorkout, saveGymLog, setPlanModal, weekRatings, rateWeek, history, setHistory }) {
  const [detailSession, setDetailSession] = useState(null);
  const [extraLog, setExtraLog] = useState(false);
  const [extraType, setExtraType] = useState('easy');
  const [extraTime, setExtraTime] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  if (!plan) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',padding:32,textAlign:'center'}}>
      <svg width="64" height="66" viewBox="0 0 120 124" fill="none" style={{marginBottom:16}}>
        <path d="M 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 L 8 26 Z" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none"/>
        <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="var(--card)"/>
      </svg>
      <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,marginBottom:8}}>No Plan Loaded</div>
      <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.6,marginBottom:24,maxWidth:280}}>Load your training plan to get started.</div>
      <button onClick={()=>setPlanModal(true)} style={{background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:10,padding:'13px 28px',fontSize:15,fontWeight:800,cursor:'pointer'}}>
        Load Training Plan
      </button>
    </div>
  );

  if (detailSession) {
    return (
      <SessionDetail
        session={detailSession.session}
        wkIdx={detailSession.wkIdx}
        plan={plan}
        completion={completions[`${detailSession.wkIdx}_${detailSession.session.id}`]}
        gymLog={gymLogs[`${detailSession.wkIdx}_${detailSession.session.id}`] || {}}
        onBack={() => setDetailSession(null)}
        onTick={tickSession}
        onUntick={untickSession}
        onCompleteWorkout={completeWorkout}
        onSaveGymLog={saveGymLog}
      />
    );
  }

  const w = plan.weeks[curWk];
  const isCurrent = curWk === getCurWk(plan);
  const runs = w.sessions.filter(s => !s.isGym);
  const gyms = w.sessions.filter(s => s.isGym);
  const nonRest = w.sessions.filter(s => s.type !== 'rest');
  const done = nonRest.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const pct = nonRest.length > 0 ? Math.round((done / nonRest.length) * 100) : 0;
  const tHrs = parseFloat(w.targets?.hrs || 0);
  let logHrs = 0, logKm = 0;
  w.sessions.forEach(s => {
    const c = completions[`${curWk}_${s.id}`];
    if (c?.time) { const p = c.time.split(':'); logHrs += p.length === 2 ? parseInt(p[0]) + parseInt(p[1]) / 60 : parseFloat(p[0]) || 0; }
    if (c?.dist) logKm += parseFloat(c.dist) || 0;
  });
  const hrsPct = tHrs > 0 ? Math.min(100, Math.round((logHrs / tHrs) * 100)) : 0;

  const logExtra = () => {
    if (!extraTime) return;
    const mins = parseInt(extraTime);
    const entry = {
      id: Date.now(), type: extraType === 'gym' ? 'gym' : 'run',
      workout: extraNotes || `Extra — ${extraType}`,
      sessionType: extraType, date: new Date().toISOString(),
      time: `${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`,
      dist: '', notes: extraNotes,
    };
    setHistory(prev => [entry, ...prev]);
    setExtraLog(false); setExtraTime(''); setExtraNotes('');
  };

  return (
    <div style={{padding:'0 0 16px'}}>
      {/* Week header */}
      <div style={{padding:'20px 16px 14px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setCurWk(Math.max(0,curWk-1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
            <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--muted)'}}>{wkRange(plan.meta.startDate,curWk)}</span>
            <button onClick={()=>setCurWk(Math.min(plan.weeks.length-1,curWk+1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
          </div>
          <div style={{background:isCurrent?'var(--gd)':'var(--card)',border:`1px solid ${isCurrent?'var(--green)':'var(--border)'}`,borderRadius:6,padding:'3px 10px',fontFamily:'DM Mono,monospace',fontSize:9,color:isCurrent?'var(--green)':'var(--muted)',fontWeight:600,letterSpacing:1}}>
            WK {w.week}{isCurrent?' · NOW':''}
          </div>
        </div>

        <div style={{fontSize:15,fontWeight:600,letterSpacing:'-.2px',marginBottom:12,color:'var(--text2)'}}>{w.phase}</div>

        {/* KPI row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
          {[
            {val:logHrs>0?logHrs.toFixed(1):(w.targets?.hrs||'—'),lbl:logHrs>0?'HRS DONE':'HRS TARGET',hit:logHrs>0},
            {val:runs.length,lbl:'RUNS'},
            {val:gyms.length,lbl:'GYM'},
            {val:logKm>0?logKm.toFixed(0)+'km':'—',lbl:'KM DONE',hit:logKm>0},
          ].map((k,i)=>(
            <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 10px'}}>
              <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,lineHeight:1,color:k.hit?'var(--green)':'var(--text)'}}>{k.val}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--muted)',letterSpacing:.5,marginTop:3}}>{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div style={{marginBottom:2}}>
          <div style={{display:'flex',justifyContent:'space-between',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',marginBottom:3}}>
            <span>{done}/{nonRest.length} sessions</span><span>{pct}%</span>
          </div>
          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
            <div style={{width:`${pct}%`,height:'100%',background:'var(--green)',borderRadius:2,transition:'width .5s ease'}}/>
          </div>
          {tHrs>0&&<>
            <div style={{display:'flex',justifyContent:'space-between',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',marginBottom:3}}>
              <span>Hours</span><span>{logHrs.toFixed(1)}/{tHrs}hrs</span>
            </div>
            <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${hrsPct}%`,height:'100%',background:'var(--easy)',borderRadius:2,opacity:.8,transition:'width .5s ease'}}/>
            </div>
          </>}
        </div>
      </div>

      {/* Coach note */}
      {w.coachNote&&<CoachNote note={w.coachNote}/>}

      {/* Sessions */}
      <div style={{padding:'0 12px'}}>
        {runs.length>0&&<>
          <SectionLabel>Runs ({runs.length})</SectionLabel>
          {runs.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}
        {gyms.length>0&&<>
          <SectionLabel>Gym ({gyms.length})</SectionLabel>
          {gyms.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}

        {/* Week rating */}
        <div style={{marginTop:10}}>
          <WeekRating wkIdx={curWk} current={weekRatings?.[curWk]} onChange={rateWeek}/>
        </div>

        {/* Log extra session */}
        <div style={{marginTop:8}}>
          <button onClick={()=>setExtraLog(!extraLog)} style={{width:'100%',background:'transparent',border:'1px dashed rgba(255,255,255,0.12)',borderRadius:10,padding:'10px',fontSize:12,color:'rgba(244,244,242,0.35)',cursor:'pointer',fontFamily:'DM Mono,monospace',letterSpacing:1,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,196,106,0.3)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}>
            + LOG EXTRA SESSION
          </button>
          {extraLog&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginTop:8}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:3,marginBottom:10}}>EXTRA SESSION</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>TYPE</label>
                  <select value={extraType} onChange={e=>setExtraType(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F4F4F2',fontSize:14,padding:'9px 10px',outline:'none'}}>
                    {['easy','long','vest','speed','gym','other'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>DURATION (min)</label>
                  <input type="number" value={extraTime} onChange={e=>setExtraTime(e.target.value)} placeholder="60" style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F4F4F2',fontSize:14,padding:'9px 10px',outline:'none'}}/>
                </div>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>NOTES</label>
                <input type="text" value={extraNotes} onChange={e=>setExtraNotes(e.target.value)} placeholder="What did you do?" style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F4F4F2',fontSize:14,padding:'9px 10px',outline:'none'}}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setExtraLog(false)} style={{flex:1,background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:11,fontSize:13,color:'var(--muted)',cursor:'pointer'}}>Cancel</button>
                <button onClick={logExtra} style={{flex:2,background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:9,padding:11,fontSize:14,fontWeight:700,cursor:'pointer'}}>Log Session</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoachNote({ note }) {
  const [open, setOpen] = useState(false);
  const preview = note.split('\n')[0].slice(0, 90);
  return (
    <div style={{margin:'0 12px 12px',background:'var(--card)',border:'1px solid var(--border)',borderLeft:'2px solid var(--green)',borderRadius:10,overflow:'hidden'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'11px 13px',display:'flex',alignItems:'flex-start',gap:8,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,fontWeight:700,flexShrink:0,marginTop:1}}>COACH</span>
        <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,flex:1}}>{open?note:preview+(note.length>90?'…':'')}</span>
        <span style={{color:'var(--muted)',fontSize:12,marginTop:1,transform:open?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}>▾</span>
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,fontWeight:700,margin:'12px 0 8px',paddingLeft:2}}>{children}</div>;
}

function SessionRow({ session: s, completion, onTap }) {
  const tc = SESSION_TYPES[s.type] || SESSION_TYPES.easy;
  const isDone = completion?.done;
  return (
    <button onClick={onTap} style={{width:'100%',background:'var(--card)',border:`1px solid ${isDone?'var(--green)':'var(--border)'}`,borderRadius:13,marginBottom:8,padding:'14px 15px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',textAlign:'left',transition:'border-color .15s'}}>
      <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:isDone?'var(--green)':'transparent',border:`2px solid ${isDone?'var(--green)':'var(--border2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:isDone?'#0A0A0A':'transparent'}}>
        {isDone?'✓':''}
      </div>
      <div style={{width:7,height:7,borderRadius:'50%',background:tc.color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,letterSpacing:'-.2px',color:'var(--text)',display:'flex',alignItems:'center',gap:6}}>
          {s.name}
          {s.isGym&&<span style={{fontSize:9,fontFamily:'DM Mono,monospace',color:'var(--gym)',background:'var(--gym-d)',padding:'2px 5px',borderRadius:4}}>GYM</span>}
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--muted)',marginTop:2}}>{s.target.split('·')[0].trim()}</div>
        {isDone&&!s.isGym&&(completion?.time||completion?.dist)&&(
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--green)',marginTop:2}}>
            {completion.time||''}{completion.dist?' · '+parseFloat(completion.dist).toFixed(1)+'km':''}
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
        <span style={{fontSize:9,fontFamily:'DM Mono,monospace',background:tc.bg,color:tc.color,padding:'2px 7px',borderRadius:5,fontWeight:600}}>{tc.label}</span>
        <span style={{color:'var(--muted)',fontSize:14}}>›</span>
      </div>
    </button>
  );
}
