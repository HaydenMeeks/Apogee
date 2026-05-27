import { useState } from 'react';
import { SESSION_TYPES } from '../utils.js';
import WorkoutModal from './WorkoutModal.jsx';

export default function SessionDetail({ session:s, wkIdx, plan, completion, gymLog, onBack, onTick, onUntick, onCompleteWorkout, onSaveGymLog }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [timeVal, setTimeVal] = useState('');
  const [distVal, setDistVal] = useState('');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const tc = SESSION_TYPES[s.type]||SESSION_TYPES.easy;
  const isDone = completion?.done;
  const isGym = s.isGym;

  const handleTick = () => {
    const mins = parseInt(timeVal)||0;
    onTick(wkIdx, s.id, {
      time: mins>0?`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`:'',
      dist: distVal,
      notes: '',
    });
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const handleGymComplete = (exercises) => {
    onCompleteWorkout(wkIdx, s.id, exercises);
    setWorkoutOpen(false);
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const focusParts = {purpose:'',cue:'',rest:''};
  if(s.focus){
    const m1=s.focus.match(/PURPOSE:(.*?)(?=KEY CUE:|$)/s);
    const m2=s.focus.match(/KEY CUE:(.*?)(?=\n\n|$)/s);
    if(m1)focusParts.purpose=m1[1].trim();
    if(m2)focusParts.cue=m2[1].trim();
    if(!m1&&!m2)focusParts.rest=s.focus;
  }
  const preview = (s.focus||'').split('\n')[0].slice(0,100);

  return (
    <>
      <style>{`
        .sd-wrap {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (min-width: 768px) { .sd-wrap { left: 260px; } }
        .sd-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        .sd-cta {
          flex-shrink: 0;
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 8px));
          background: var(--bg);
          border-top: 1px solid var(--border);
        }
        @media (min-width: 768px) {
          .sd-cta { padding-bottom: 16px; }
        }
      `}</style>

      <div className="sd-wrap">

        {/* ── HEADER — fixed at top ── */}
        <div style={{flexShrink:0, background:tc.bg, borderBottom:`1px solid ${tc.color}22`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 0'}}>
            <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'6px 12px 6px 8px',color:'var(--text)',fontSize:14,fontWeight:500,cursor:'pointer'}}>
              ← Week {wkIdx+1}
            </button>
            {isDone&&<div style={{background:'var(--green)',color:'#0A0A0A',borderRadius:20,padding:'5px 12px',fontSize:11,fontFamily:'DM Mono,monospace',fontWeight:700,letterSpacing:1}}>DONE</div>}
          </div>
          <div style={{padding:'12px 18px 18px'}}>
            <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:26,lineHeight:1.1,letterSpacing:'-.5px',marginBottom:8}}>{s.name}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
              {isGym
                ? <Pill color="#06B6D4" bg="rgba(6,182,212,.2)">GYM</Pill>
                : <>
                    <Pill color={tc.color} bg={`${tc.color}30`}>{tc.label}</Pill>
                    <Pill color={s.hard?'#EF4444':'var(--green)'} bg={s.hard?'rgba(239,68,68,.2)':'rgba(0,196,106,.2)'}>{s.hard?'HARD':'EASY'}</Pill>
                  </>
              }
            </div>
            <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2}}>
              <StatChip label="DURATION" val={s.target.split('·')[0].trim()}/>
              {s.target.includes('HR')&&<StatChip label="HR CAP" val={(s.target.match(/(\d+)bpm/)||[])[1]?((s.target.match(/(\d+)bpm/)||[])[1]+'bpm'):'132bpm'}/>}
              <StatChip label="PHASE" val={(plan?.weeks[wkIdx]?.phase||'').split('·').pop().trim().slice(0,18)||'—'}/>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="sd-body" style={{padding:'14px 14px 24px'}}>

          {/* Coach note */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderLeft:'2px solid var(--green)',borderRadius:12,marginBottom:12,overflow:'hidden'}}>
            <button onClick={()=>setNoteOpen(!noteOpen)} style={{width:'100%',padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:10,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,fontWeight:700,flexShrink:0,marginTop:1}}>COACH</span>
              <div style={{flex:1,fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
                {noteOpen?(
                  <>
                    {focusParts.purpose&&<><div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:2,marginBottom:3}}>PURPOSE</div><p style={{marginBottom:10}}>{focusParts.purpose}</p></>}
                    {focusParts.cue&&<><div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#F59E0B',letterSpacing:2,marginBottom:3}}>KEY CUE</div><p>{focusParts.cue}</p></>}
                    {focusParts.rest&&<p>{focusParts.rest}</p>}
                  </>
                ):(
                  <span>{preview}{(s.focus||'').length>100?'…':''}</span>
                )}
              </div>
              <span style={{color:'var(--muted)',fontSize:12,marginTop:1,flexShrink:0,transform:noteOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
            </button>
          </div>

          {/* Gym exercise preview */}
          {isGym&&s.gymSession?.exercises&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#06B6D4',letterSpacing:3,marginBottom:10,fontWeight:700}}>PRESCRIBED</div>
              {s.gymSession.exercises.map((ex,i)=>(
                <div key={i} style={{padding:'8px 0',borderBottom:i<s.gymSession.exercises.length-1?`1px solid var(--border)`:'none'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:2,color:'var(--text)'}}>{ex.name}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--muted)'}}>
                    <span style={{color:'var(--green)'}}>{ex.sets}×{ex.reps}</span> @ {ex.load}{ex.rest?` · ${ex.rest}`:''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Run log */}
          {!isGym&&!isDone&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:3,marginBottom:10}}>LOG THIS SESSION</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <LInput label="TIME (min)" type="number" placeholder="60" val={timeVal} set={setTimeVal}/>
                <LInput label="KM" type="number" placeholder="—" val={distVal} set={setDistVal} step="0.1"/>
              </div>
            </div>
          )}

          {/* Done summary */}
          {isDone&&!isGym&&(completion?.time||completion?.dist)&&(
            <div style={{background:'var(--card)',border:'1px solid var(--green)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,marginBottom:8}}>LOGGED</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {completion.time&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{completion.time}</div><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--muted)'}}>TIME</div></div>}
                {completion.dist&&parseFloat(completion.dist)>0&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{parseFloat(completion.dist).toFixed(1)}km</div><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--muted)'}}>DIST</div></div>}
              </div>
            </div>
          )}
        </div>

        {/* ── CTA — anchored to bottom ── */}
        <div className="sd-cta">
          {isGym&&!isDone&&(
            <button onClick={()=>setWorkoutOpen(true)} style={{width:'100%',background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',letterSpacing:.3}}>
              Begin Workout
            </button>
          )}
          {isGym&&isDone&&(
            <button onClick={()=>onUntick(wkIdx,s.id)} style={{width:'100%',background:'var(--card)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:13,padding:16,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Mark Incomplete
            </button>
          )}
          {!isGym&&!isDone&&(
            <button onClick={handleTick} style={{width:'100%',background:justDone?'#00A858':'var(--green)',color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',transition:'background .3s',letterSpacing:.3}}>
              {justDone?'Done!':'Mark Complete'}
            </button>
          )}
          {!isGym&&isDone&&(
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>onUntick(wkIdx,s.id)} style={{background:'var(--card)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:13,padding:'14px 18px',fontSize:14,fontWeight:600,cursor:'pointer'}}>↺</button>
              <button onClick={()=>{handleTick();setTimeout(onBack,400);}} style={{flex:1,background:'var(--card)',color:'var(--text)',border:'1px solid var(--green)',borderRadius:13,padding:14,fontSize:14,fontWeight:700,cursor:'pointer'}}>Update Log</button>
            </div>
          )}
        </div>
      </div>

      {workoutOpen&&s.gymSession&&(
        <WorkoutModal session={s} wkIdx={wkIdx} gymLog={gymLog} onClose={()=>setWorkoutOpen(false)} onComplete={handleGymComplete} onSaveLog={onSaveGymLog}/>
      )}
    </>
  );
}

function Pill({color,bg,children}){return<span style={{fontSize:10,fontFamily:'DM Mono,monospace',padding:'3px 8px',borderRadius:5,background:bg,color,fontWeight:700,letterSpacing:1}}>{children}</span>;}
function StatChip({label,val}){return<div style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',flexShrink:0,minWidth:90}}><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'rgba(244,244,242,0.4)',letterSpacing:2,marginBottom:3}}>{label}</div><div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{val}</div></div>;}
function LInput({label,val,set,type='text',placeholder,step}){
  return<div><label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>{label}</label>
    <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} step={step} style={{width:'100%',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'DM Mono,monospace',fontSize:16,padding:'9px 10px',outline:'none'}}/>
  </div>;
}
