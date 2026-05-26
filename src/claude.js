// ── Claude API integration ────────────────────────────────
// Called via Vercel serverless function to keep API key server-side

export async function askClaude(messages, plan, completions, weekRatings) {
  const curWk = plan?.weeks ? Math.floor((new Date() - new Date(plan.meta.startDate)) / (7 * 86400000)) : 0;
  const currentWeek = plan?.weeks[curWk];
  
  // Build context for Claude
  const systemPrompt = `You are the AI coach for APOGEE, a training app for Hayden Meaclem (95kg, Melbourne, shift worker) who is training for:
- Surf Coast Century 100km — September 12 2026 (goal: sub 12 hours)
- GPT 100 Miles — November 6 2026 (goal: competitive finish, 7700m vert)

Current training context:
- AeT: ~132-135bpm | AnT: 157bpm | AeT gap: ~14% (target <10%)
- Easy run HR cap: 132bpm (walk when watch beeps, every time)
- All easy runs are TIME-based, no km targets
- Johnston ME protocol: vest sessions building to 15% BW load
- Current week: ${curWk + 1} of ${plan?.weeks?.length || 25}
- Current phase: ${currentWeek?.phase || 'Unknown'}

Training week ${curWk + 1} sessions:
${currentWeek?.sessions?.map(s => `- ${s.name}: ${s.target}`).join('\n') || 'No sessions'}

Week ratings history (1=Too Easy, 2=About Right, 3=Too Hard):
${Object.entries(weekRatings || {}).slice(-4).map(([w, r]) => `Week ${w}: ${['','Too Easy','About Right','Too Hard'][r]}`).join('\n') || 'No ratings yet'}

Completed sessions this block: ${Object.values(completions || {}).filter(c => c?.done).length}

You can suggest specific plan modifications. When you do, format them clearly so the user can approve them. Keep responses concise and practical — this is a coaching chat, not an essay. Use plain text, no markdown headers. Be direct.`;

  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    });
    
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.content;
  } catch (err) {
    console.error('Claude API error:', err);
    return 'Sorry, having trouble connecting right now. Try again in a moment.';
  }
}
