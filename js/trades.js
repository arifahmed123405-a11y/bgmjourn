// Trades page logic
document.addEventListener("DOMContentLoaded", async () => {
  const user = await supabase.auth.getUser();
  if(!user.data.user) return location.href = "index.html";

  const btnAdd = document.getElementById("btn-add");
  const btnRefresh = document.getElementById("btn-refresh");
  const tmsg = document.getElementById("t-msg");
  const tableBody = document.querySelector("#trades-table tbody");

  async function fetchTrades(){
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.data.user.id)
      .order("created_at", { ascending: false });
    if(error) { tmsg.textContent = error.message; return []; }
    return data || [];
  }

  function renderTrades(rows){
    tableBody.innerHTML = "";
    rows.forEach(r => {
      const pl = r.exit_price && r.entry_price ? (Number(r.exit_price) - Number(r.entry_price)) * Number(r.size) * (r.direction === "long" ? 1 : -1) : 0;
      const profitPct = r.profit_pct ?? (r.exit_price && r.entry_price ? ((Number(r.exit_price) - Number(r.entry_price))/Number(r.entry_price)) * 100 * (r.direction === "long" ? 1 : -1) : 0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.symbol}</td>
        <td>${r.entry_price ? fmt(r.entry_price) : "-"}</td>
        <td>${r.exit_price ? fmt(r.exit_price) : "-"}</td>
        <td>${r.size}</td>
        <td><span class="pill ${pl>=0?'green':'red'}">${pl>=0?'+':'-'}${fmt(Math.abs(pl))}</span></td>
        <td>${profitPct? (Number(profitPct).toFixed(2) + "%") : "-"}</td>
        <td class="muted">${new Date(r.created_at).toLocaleString()}</td>
        <td><button class="btn ghost" data-id="${r.id}" onclick="editTrade('${r.id}')">Edit</button> <button class="btn" onclick="deleteTrade('${r.id}')">Delete</button></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  window.editTrade = async (id) => {
    const { data } = await supabase.from("trades").select("*").eq("id", id).single();
    if(!data) return alert("Trade not found");
    document.getElementById("t-symbol").value = data.symbol;
    document.getElementById("t-direction").value = data.direction;
    document.getElementById("t-entry").value = data.entry_price;
    document.getElementById("t-exit").value = data.exit_price;
    document.getElementById("t-size").value = data.size;
    document.getElementById("t-notes").value = data.notes || "";
    // Save as update on add click
    btnAdd.textContent = "Update trade";
    btnAdd.dataset.editId = id;
  };

  window.deleteTrade = async (id) => {
    if(!confirm("Delete this trade?")) return;
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if(error) return alert(error.message);
    load();
  };

  btnAdd.onclick = async () => {
    const symbol = document.getElementById("t-symbol").value.trim();
    const direction = document.getElementById("t-direction").value;
    const entry = parseFloat(document.getElementById("t-entry").value);
    const exit = parseFloat(document.getElementById("t-exit").value);
    const size = parseFloat(document.getElementById("t-size").value);
    const notes = document.getElementById("t-notes").value;

    if(!symbol || !entry || !size){ tmsg.textContent = "Symbol, entry and size are required"; return; }

    // compute profit and profit_pct
    let profit = null, profit_pct = null, rr = null;
    if(!isNaN(exit)){
      profit = (exit - entry) * size * (direction === "long" ? 1 : -1);
      profit_pct = (profit / (entry * Math.abs(size))) * 100;
    }

    const payload = {
      user_id: user.data.user.id,
      symbol, direction, entry_price: entry, exit_price: isNaN(exit)? null : exit,
      size, notes, profit, profit_pct, rr
    };

    if(btnAdd.dataset.editId){
      const id = btnAdd.dataset.editId;
      const { error } = await supabase.from("trades").update(payload).eq("id", id);
      if(error) { tmsg.textContent = error.message; return; }
      btnAdd.textContent = "Add trade";
      delete btnAdd.dataset.editId;
    } else {
      const { error } = await supabase.from("trades").insert(payload);
      if(error) { tmsg.textContent = error.message; return; }
    }
    tmsg.textContent = "Saved";
    setTimeout(()=> tmsg.textContent = "", 1200);
    load();
  };

  btnRefresh.onclick = load;

  async function load(){
    const rows = await fetchTrades();
    renderTrades(rows);
  }

  load();
});
