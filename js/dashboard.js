// Dashboard charts and equity curve
document.addEventListener("DOMContentLoaded", async () => {
  const user = await supabase.auth.getUser();
  if(!user.data.user) return location.href = "index.html";

  const eqCtx = document.getElementById("equityChart").getContext("2d");
  const plCtx = document.getElementById("plCandles").getContext("2d");

  async function getTrades(){
    const { data } = await supabase.from("trades").select("*").eq("user_id", user.data.user.id).order("created_at", { ascending: true });
    return data || [];
  }

  function computeEquity(trades, starting=10000){
    // starting balance default 10k
    let bal = starting;
    const points = [];
    trades.forEach(t => {
      const profit = t.profit ?? (t.exit_price && t.entry_price ? (Number(t.exit_price)-Number(t.entry_price))*Number(t.size)*(t.direction==='long'?1:-1) : 0);
      bal += profit || 0;
      points.push({x: new Date(t.created_at), y: Number(bal)});
    });
    return points;
  }

  function computePLCandles(trades){
    // Each trade becomes a candle: open=0, close=profit, high=max(0,profit), low=min(0,profit)
    return trades.map(t => {
      const profit = t.profit ?? (t.exit_price && t.entry_price ? (Number(t.exit_price)-Number(t.entry_price))*Number(t.size)*(t.direction==='long'?1:-1) : 0);
      const o = 0;
      const c = Number(profit);
      const h = Math.max(o,c);
      const l = Math.min(o,c);
      return { t: new Date(t.created_at), o, h, l, c };
    });
  }

  // Draw charts
  const equityChart = new Chart(eqCtx, {
    type: 'line',
    data: { datasets: [{ label: 'Equity', data: [], borderColor: 'var(--green)', backgroundColor: 'rgba(22,163,74,0.08)', tension:0.2, pointRadius:2 }]},
    options: { scales:{ x:{ type:'time', time:{unit:'day'} }, y:{ beginAtZero:false } }, plugins:{ legend:{display:false} } }
  });

  const plChart = new Chart(plCtx, {
    type: 'candlestick',
    data: { datasets: [{ label:'P/L', data: [], color: { up: 'var(--green)', down: 'var(--red)', unchanged: '#999' } }]},
    options: { plugins:{ legend:{display:false} }, scales:{ x:{ type:'time', time:{unit:'day'} } } }
  });

  async function load(){
    const trades = await getTrades();
    const eq = computeEquity(trades);
    const candles = computePLCandles(trades);

    equityChart.data.datasets[0].data = eq;
    equityChart.update();

    plChart.data.datasets[0].data = candles;
    plChart.update();

    // Quick stats
    const net = trades.reduce((s,t)=> s + (t.profit ?? 0), 0);
    const wins = trades.filter(t => (t.profit ?? 0) > 0).length;
    const losses = trades.filter(t => (t.profit ?? 0) < 0).length;
    const winRate = trades.length ? (wins / trades.length) : 0;
    const avgWin = trades.filter(t=> (t.profit ?? 0) > 0).reduce((s,t)=> s + (t.profit ?? 0),0) / Math.max(1,wins);
    const avgLoss = trades.filter(t=> (t.profit ?? 0) < 0).reduce((s,t)=> s + (t.profit ?? 0),0) / Math.max(1,losses);
    const expectancy = (winRate * (avgWin || 0)) - ((1-winRate) * Math.abs(avgLoss || 0));

    document.getElementById("stat-balance").textContent = "$" + fmt((eq.length? eq[eq.length-1].y : 10000));
    document.getElementById("stat-netpl").textContent = "$" + fmt(net);
    document.getElementById("stat-win").textContent = (winRate*100).toFixed(2) + "%";
    document.getElementById("stat-exp").textContent = fmt(expectancy);
  }

  load();
});
