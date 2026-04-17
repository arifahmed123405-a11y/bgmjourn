// Stats page computations and charts
document.addEventListener("DOMContentLoaded", async () => {
  const user = await supabase.auth.getUser();
  if(!user.data.user) return location.href = "index.html";

  async function getTrades(){
    const { data } = await supabase.from("trades").select("*").eq("user_id", user.data.user.id).order("created_at", { ascending: true });
    return data || [];
  }

  const trades = await getTrades();

  // Win rate chart
  const wins = trades.filter(t => (t.profit ?? 0) > 0).length;
  const losses = trades.filter(t => (t.profit ?? 0) < 0).length;
  const winRate = trades.length ? wins / trades.length : 0;

  const winCtx = document.getElementById("winChart").getContext("2d");
  new Chart(winCtx, {
    type: 'doughnut',
    data: { labels:['Wins','Losses'], datasets:[{ data:[wins, losses], backgroundColor:['var(--green)','var(--red)'] }]},
    options:{ plugins:{ legend:{position:'bottom'} } }
  });

  // Expectancy
  const avgWin = trades.filter(t=> (t.profit ?? 0) > 0).reduce((s,t)=> s + (t.profit ?? 0),0) / Math.max(1,wins);
  const avgLoss = trades.filter(t=> (t.profit ?? 0) < 0).reduce((s,t)=> s + (t.profit ?? 0),0) / Math.max(1,losses);
  const expectancy = (winRate * (avgWin || 0)) - ((1-winRate) * Math.abs(avgLoss || 0));
  document.getElementById("expectancy").textContent = fmt(expectancy);

  // Profit % distribution histogram
  const profitPcts = trades.map(t => Number(t.profit_pct || 0));
  const bins = [-50,-20,-10,-5,0,5,10,20,50,100];
  const counts = bins.map((b,i) => {
    const lo = b;
    const hi = bins[i+1] ?? Infinity;
    return profitPcts.filter(p => p >= lo && p < hi).length;
  });

  const distCtx = document.getElementById("distChart").getContext("2d");
  new Chart(distCtx, {
    type: 'bar',
    data: { labels: bins.map((b,i)=> `${b}${bins[i+1] ? ' to ' + (bins[i+1]-0) : '+'}`), datasets:[{ data:counts, backgroundColor:'rgba(10,132,255,0.9)' }]},
    options:{ plugins:{ legend:{display:false} }, scales:{ x:{ ticks:{autoSkip:false} } } }
  });
});
