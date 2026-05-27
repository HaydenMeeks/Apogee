import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const S = {
  bg: '#0A0A0A', surface: '#161616', card: '#222',
  border: 'rgba(255,255,255,0.1)', border2: 'rgba(255,255,255,0.18)',
  text: '#F4F4F2', text2: 'rgba(244,244,242,0.75)', muted: 'rgba(244,244,242,0.4)',
  green: '#00C46A',
};

const JOHNSTON_INFO = {
  'Split Jump Squat': 'Jump and switch legs in air. Land softly. ~1 jump/sec. Non-negotiable.',
  'Squat Jump': 'Full depth squat, explosive jump. ~1 jump/sec.',
  'Box Step-Up (21")': 'All R leg then all L leg. ~1 rep/sec. Box at ~75% kneecap height.',
  'Front Lunge': '40-60cm lunge. All R then all L. ~1 rep/sec. Hits glutes hardest.',
  'Lateral Lunge': 'All R then all L. ~1 rep/sec.',
  'Reverse Lunge': 'All R then all L. ~1 rep/sec.',
  'Bulgarian Jump Squat': 'Rear foot elevated. All R then all L. ~1 rep/sec.',
  'Broad Jump': 'Max horizontal jump. Stick the landing. Reset between reps.',
  'Tuck Jump': 'Jump and pull knees to chest. Land softly. ~1 jump/sec.',
  'Single-leg Forward Hop': 'All R then all L. Controlled landing.',
  'Goblet Squat / Overhead Press': 'KB at chest, press overhead at top. Controlled.',
  'KB Swing': 'Hip drive, not a squat. Hinge and snap hips.',
};

export default function WorkoutModal({ session: s, wkIdx, gymLog, onClose, onComplete, onSaveLog }) {
  const gs = s.gymSession;
  const isME = gs?.type === 'ME_JOHNSTON' || s.name?.includes('ME');
  const [log, setLog] = useState(gymLog || {});
  const [timers, setTimers] = useState({});
  const [warmupDone, setWarmupDone] = useState(!!gymLog?.warmup_done);
  const timerRefs = useRef({});

  const save = (field, val) => {
    const nl = { ...log, [field]: val };
    setLog(nl);
    onSaveLog(wkIdx, s.id, field, val);
    return nl;
  };

  const startTimer = (tid, secs) => {
    if (timerRefs.current[tid]) clearInterval(timerRefs.current[tid]);
    setTimers(p => ({ ...p, [tid]: { rem: secs, total: secs, done: false } }));
    timerRefs.current[tid] = setInterval(() => {
      setTimers(p => {
        const t = p[tid];
        if (!t || t.rem <= 1) {
          clearInterval(timerRefs.current[tid]);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => setTimers(pp => { const n = { ...pp }; delete n[tid]; return n; }), 4000);
          return { ...p, [tid]: { ...t, rem: 0, done: true } };
        }
        return { ...p, [tid]: { ...t, rem: t.rem - 1 } };
      });
    }, 1000);
  };

  const skipTimer = tid => {
    if (timerRefs.current[tid]) clearInterval(timerRefs.current[tid]);
    setTimers(p => { const n = { ...p }; delete n[tid]; return n; });
  };

  useEffect(() => () => Object.values(timerRefs.current).forEach(clearInterval), []);

  const totalSets = isME
    ? gs.exercises.reduce((a, ex) => a + (parseInt(String(ex.sets)) || 3), 0)
    : gs.exercises.length;
  const doneSets = isME
    ? gs.exercises.reduce((a, ex, ei) => {
        const ps = parseInt(String(ex.sets)) || 3;
        return a + Array.from({length:ps},(_,si)=>log[`ex_${ei}_s${si}`]?1:0).reduce((x,y)=>x+y,0);
      }, 0)
    : gs.exercises.filter((_,i)=>log[`ex_${i}_done`]).length;
  const pct = totalSets > 0 ? Math.round((doneSets/totalSets)*100) : 0;

  const handleComplete = () => {
    const exercises = gs.exercises.map((ex, ei) => ({
      name: ex.name,
      sets: parseInt(String(ex.sets)) || 3,
      reps: ex.reps,
      weight: log[`ex_${ei}_s0_kg`] || 0,
      notes: log[`ex_${ei}_notes`] || '',
    }));
    onComplete(exercises);
  };

  const modal = (
    <div
      style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(6px)',display:'flex',alignItems:'flex-end'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}
    >
      <div style={{background:S.surface,borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'94vh',display:'flex',flexDirection:'column',boxShadow:'0 -12px 48px rgba(0,0,0,.7)'}}>

        {/* Header */}
        <div style={{padding:'18px 18px 14px',borderBottom:`1px solid ${S.border}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:17,fontWeight:700}}>{s.name}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:S.muted,marginTop:2,letterSpacing:1}}>
              {gs.vest}{gs.meWorkoutNumber?` · WO${gs.meWorkoutNumber}`:''}
            </div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',background:S.card,border:`1px solid ${S.border}`,color:S.muted,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{height:3,background:S.border,flexShrink:0}}>
          <div style={{width:`${pct}%`,height:'100%',background:S.green,transition:'width .4s ease'}}/>
        </div>

        <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>

          {/* Johnston Warmup */}
          {isME && (
            <div style={{margin:'14px 14px 0',background:warmupDone?'rgba(0,196,106,0.08)':'rgba(245,158,11,0.08)',border:`1px solid ${warmupDone?'rgba(0,196,106,0.3)':'rgba(245,158,11,0.3)'}`,borderRadius:12,overflow:'hidden'}}>
              <button onClick={()=>{setWarmupDone(!warmupDone);save('warmup_done',!warmupDone);}}
                style={{width:'100%',padding:'12px 14px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:warmupDone?S.green:'#F59E0B',letterSpacing:3,fontWeight:700}}>
                  {warmupDone?'✓ WARM UP DONE':'WARM UP — DO THIS FIRST'}
                </div>
                <div style={{width:22,height:22,borderRadius:'50%',background:warmupDone?S.green:'transparent',border:`2px solid ${warmupDone?S.green:'rgba(245,158,11,0.5)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:warmupDone?'#0A0A0A':'#F59E0B',fontWeight:700,flexShrink:0}}>
                  {warmupDone?'✓':''}
                </div>
              </button>
              {!warmupDone&&(
                <div style={{padding:'0 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
                  {[
                    '10–15 min light aerobic, building to Zone 3 effort for the final 2 min',
                    '10 get-ups — lie on your back, get up off the floor, repeat',
                    '10 burpees',
                  ].map((item,i)=>(
                    <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:'DM Mono,monospace',color:'#F59E0B',flexShrink:0,marginTop:1}}>{i+1}</div>
                      <div style={{fontSize:14,color:S.text2,lineHeight:1.5}}>{item}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Non-ME warmup */}
          {!isME&&gs.warmup&&(
            <div style={{margin:'14px 14px 0',padding:'10px 13px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#F59E0B',letterSpacing:3,marginBottom:4}}>WARM UP</div>
              <div style={{fontSize:13,color:S.text2,lineHeight:1.5}}>{gs.warmup}</div>
            </div>
          )}

          <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.green,letterSpacing:3,padding:'12px 14px 6px',fontWeight:700}}>
            {isME?'EXERCISES — COMPLETE ALL SETS BEFORE MOVING ON':'EXERCISES'}
          </div>

          {/* ME — set counter buttons */}
          {isME&&gs.exercises.map((ex,ei)=>{
            const ps=parseInt(String(ex.sets))||3;
            const restSecs=ex.rest?(String(ex.rest).match(/(\d+)/)?.[1]||45):45;
            const doneCount=Array.from({length:ps},(_,si)=>log[`ex_${ei}_s${si}`]?1:0).reduce((a,b)=>a+b,0);
            const allDone=doneCount===ps;
            return(
              <div key={ei} style={{margin:'0 14px 10px',background:allDone?'rgba(0,196,106,0.08)':S.card,border:`1px solid ${allDone?'rgba(0,196,106,0.3)':S.border}`,borderRadius:12,overflow:'hidden',transition:'all .2s'}}>
                <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${S.border}`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{fontSize:15,fontWeight:700,color:allDone?S.green:S.text}}>{ex.name}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:12,color:allDone?S.green:S.muted,fontWeight:700}}>{doneCount}/{ps}</div>
                  </div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:S.muted,marginBottom:6}}>
                    <span style={{color:S.green}}>{ex.sets} sets × {ex.reps}</span>
                    {ex.load&&ex.load!=='Bodyweight'&&ex.load!=='Bodyweight only'?` @ ${ex.load}`:' · bodyweight'}
                  </div>
                  {JOHNSTON_INFO[ex.name]&&(
                    <div style={{fontSize:13,color:S.text2,lineHeight:1.5,padding:'8px 10px',background:'rgba(0,196,106,0.06)',borderRadius:8,borderLeft:`2px solid ${S.green}`}}>
                      {JOHNSTON_INFO[ex.name]}
                    </div>
                  )}
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.muted,letterSpacing:2,marginBottom:10}}>
                    TAP AFTER COMPLETING EACH SET · {restSecs}SEC REST
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                    {Array.from({length:ps},(_,si)=>{
                      const setDone=!!log[`ex_${ei}_s${si}`];
                      const isNext=!setDone&&Array.from({length:si},(_,i)=>!!log[`ex_${ei}_s${i}`]).every(Boolean);
                      const tid=`me_${ei}_${si}`;
                      const isLastSet = si === ps - 1;
                      const isLastEx = ei === gs.exercises.length - 1;
                      const betweenSecs = gs.between ? parseInt(String(gs.between).match(/(\d+)/)?.[1] || 60) : 60;
                      return(
                        <button key={si} onClick={()=>{
                          if(setDone){save(`ex_${ei}_s${si}`,false);skipTimer(tid);skipTimer(`between_${ei}`);}
                          else{
                            save(`ex_${ei}_s${si}`,true);
                            if(!isLastSet) startTimer(tid, parseInt(restSecs));
                            else if(!isLastEx) startTimer(`between_${ei}`, betweenSecs);
                          }
                        }} style={{
                          width:52,height:52,borderRadius:11,
                          background:setDone?S.green:isNext?'rgba(0,196,106,0.12)':'rgba(255,255,255,0.04)',
                          border:`2px solid ${setDone?S.green:isNext?'rgba(0,196,106,0.35)':S.border}`,
                          color:setDone?'#0A0A0A':isNext?S.green:S.muted,
                          fontSize:15,fontWeight:700,fontFamily:'DM Mono,monospace',
                          cursor:'pointer',transition:'all .15s',
                        }}>
                          {setDone?'✓':si+1}
                        </button>
                      );
                    })}
                  </div>
                  {/* Active set rest timer */}
                  {Array.from({length:ps},(_,si)=>{
                    const tid=`me_${ei}_${si}`;const t=timers[tid];if(!t)return null;
                    return(
                      <div key={si} style={{borderRadius:10,overflow:'hidden',background:'#0A0A0A',border:`1.5px solid ${t.done?S.green:S.border2}`}}>
                        <div style={{height:3,background:S.green,width:t.done?'0%':`${(t.rem/t.total)*100}%`,transition:'width 1s linear'}}/>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px'}}>
                          <div>
                            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.muted,letterSpacing:2}}>REST</div>
                            {t.done?<div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:S.green,fontWeight:700,letterSpacing:2}}>NEXT SET ↑</div>
                              :<div style={{fontFamily:'Archivo Black,sans-serif',fontSize:26,color:S.green}}>{t.rem}s</div>}
                          </div>
                          {!t.done&&<button onClick={()=>skipTimer(tid)} style={{background:'#1C1C1C',border:`1px solid ${S.border}`,borderRadius:8,padding:'6px 14px',fontSize:11,fontFamily:'DM Mono,monospace',color:S.muted,cursor:'pointer',letterSpacing:1}}>SKIP</button>}
                        </div>
                      </div>
                    );
                  })}
                  {/* Between-exercises timer — fires amber after last set */}
                  {(()=>{
                    const t=timers[`between_${ei}`];
                    if(!t)return null;
                    return(
                      <div style={{borderRadius:10,overflow:'hidden',background:'#0A0A0A',border:`1.5px solid ${t.done?'#F59E0B':S.border2}`,marginTop:4}}>
                        <div style={{height:3,background:'#F59E0B',width:t.done?'0%':`${(t.rem/t.total)*100}%`,transition:'width 1s linear'}}/>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px'}}>
                          <div>
                            <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#F59E0B',letterSpacing:2}}>NEXT EXERCISE REST</div>
                            {t.done
                              ?<div style={{fontFamily:'DM Mono,monospace',fontSize:14,color:'#F59E0B',fontWeight:700,letterSpacing:2}}>NEXT EXERCISE ↓</div>
                              :<div style={{fontFamily:'Archivo Black,sans-serif',fontSize:26,color:'#F59E0B'}}>{t.rem}s</div>}
                          </div>
                          {!t.done&&<button onClick={()=>skipTimer(`between_${ei}`)} style={{background:'#1C1C1C',border:`1px solid ${S.border}`,borderRadius:8,padding:'6px 14px',fontSize:11,fontFamily:'DM Mono,monospace',color:S.muted,cursor:'pointer',letterSpacing:1}}>SKIP</button>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}

          {/* STRENGTH — kg/reps inputs, ALL exercises shown */}
          {!isME&&gs.exercises.map((ex,ei)=>{
            const isDone=!!log[`ex_${ei}_done`];
            const ps=parseInt(String(ex.sets))||3;
            const restSecs=ex.rest?(String(ex.rest).match(/(\d+)/)?.[1]||90):90;
            return(
              <div key={ei} style={{margin:'0 14px 10px',background:isDone?'rgba(0,196,106,0.06)':S.card,border:`1px solid ${isDone?'rgba(0,196,106,0.25)':S.border}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${S.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
                    <button onClick={()=>save(`ex_${ei}_done`,!log[`ex_${ei}_done`])} style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:isDone?S.green:'transparent',border:`2px solid ${isDone?S.green:S.border2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:isDone?'#0A0A0A':'transparent',cursor:'pointer',transition:'all .2s'}}>✓</button>
                    <div style={{fontSize:15,fontWeight:700,color:isDone?S.green:S.text}}>{ex.name}</div>
                  </div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:S.muted,paddingLeft:34}}>
                    <span style={{color:S.green}}>{ex.sets}×{ex.reps}</span> @ {ex.load}{ex.rest?` · Rest ${ex.rest}`:''}
                  </div>
                  {ex.coaching&&<div style={{fontSize:12,color:S.text2,lineHeight:1.55,padding:'8px 10px',background:'rgba(0,196,106,0.06)',borderRadius:8,borderLeft:`2px solid ${S.green}`,marginTop:8}}>{ex.coaching}</div>}
                </div>
                <div style={{padding:'10px 14px 12px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr',gap:5,marginBottom:6}}>
                    <div/>{['KG','REPS'].map(h=><div key={h} style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.muted,letterSpacing:2}}>{h}</div>)}
                  </div>
                  {Array.from({length:ps},(_,si)=>{
                    const kv=log[`ex_${ei}_s${si}_kg`]||'';const rv=log[`ex_${ei}_s${si}_reps`]||'';
                    const rd=kv&&rv;const tid=`str_${ei}_${si}`;const t=timers[tid];
                    const handleInput=(field,val)=>{
                      const nl=save(`ex_${ei}_s${si}_${field}`,val);
                      const kg=field==='kg'?val:nl[`ex_${ei}_s${si}_kg`]||'';
                      const rp=field==='reps'?val:nl[`ex_${ei}_s${si}_reps`]||'';
                      if(kg&&rp&&si<ps-1)startTimer(tid,parseInt(restSecs));
                    };
                    return(
                      <div key={si}>
                        <div style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr',gap:5,marginBottom:5,alignItems:'center'}}>
                          <div style={{fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,color:S.green,textAlign:'center'}}>{si+1}</div>
                          {['kg','reps'].map(f=>(
                            <input key={f} type="number" min="0" step={f==='kg'?'0.5':'1'} placeholder={f}
                              defaultValue={f==='kg'?kv:rv} onChange={e=>handleInput(f,e.target.value)}
                              style={{width:'100%',background:rd?'rgba(0,196,106,0.1)':'#111',border:`1.5px solid ${rd?S.green:S.border}`,borderRadius:8,color:S.text,fontFamily:'DM Mono,monospace',fontSize:16,padding:'9px 10px',height:42,textAlign:'center',outline:'none'}}/>
                          ))}
                        </div>
                        {t&&(
                          <div style={{marginBottom:6,borderRadius:9,overflow:'hidden',background:'#0A0A0A',border:`1.5px solid ${t.done?S.green:S.border2}`}}>
                            <div style={{height:3,background:S.green,width:t.done?'0%':`${(t.rem/t.total)*100}%`,transition:'width 1s linear'}}/>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 13px'}}>
                              <div>
                                <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.muted,letterSpacing:2}}>REST</div>
                                {t.done?<div style={{fontFamily:'DM Mono,monospace',fontSize:13,color:S.green,fontWeight:700,letterSpacing:2}}>NEXT SET ↑</div>
                                  :<div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:S.green}}>{t.rem}s</div>}
                              </div>
                              {!t.done&&<button onClick={()=>skipTimer(tid)} style={{background:'#1C1C1C',border:`1px solid ${S.border}`,borderRadius:7,padding:'5px 12px',fontSize:11,fontFamily:'DM Mono,monospace',color:S.muted,cursor:'pointer',letterSpacing:1}}>SKIP</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <textarea placeholder="Notes…" defaultValue={log[`ex_${ei}_notes`]||''}
                    onChange={e=>save(`ex_${ei}_notes`,e.target.value)}
                    style={{width:'100%',background:'#111',border:`1px solid ${S.border}`,borderRadius:8,color:S.text,fontFamily:'DM Sans,sans-serif',fontSize:13,padding:'8px 10px',resize:'none',height:40,outline:'none',marginTop:4}}/>
                </div>
              </div>
            );
          })}

          {isME&&(
            <div style={{margin:'0 14px 16px',padding:'10px 13px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:10}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#3B82F6',letterSpacing:3,marginBottom:3}}>COOL DOWN</div>
              <div style={{fontSize:13,color:S.text2}}>10 min easy aerobic — do not skip</div>
            </div>
          )}
        </div>

        <div style={{padding:'12px 14px',paddingBottom:'calc(12px + env(safe-area-inset-bottom, 16px))',borderTop:`1px solid ${S.border}`,flexShrink:0}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:S.muted,textAlign:'center',marginBottom:8}}>
            {isME?`${doneSets} of ${totalSets} sets done`:`${doneSets} of ${totalSets} exercises done`}
          </div>
          <button onClick={handleComplete} style={{width:'100%',borderRadius:12,padding:15,fontSize:15,fontWeight:800,cursor:'pointer',border:'none',background:pct>=80?S.green:'#1C1C1C',color:pct>=80?'#0A0A0A':S.muted,transition:'all .2s',letterSpacing:.3}}>
            {pct>=80?'Complete Workout':`${pct}% done — keep going`}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
