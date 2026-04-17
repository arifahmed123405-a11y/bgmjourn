// Shared libs and Supabase init
// Supabase config (from user)
const SUPABASE_URL = "https://zzxjswhyhzvjgfmmmpsv.supabase.co";
const SUPABASE_KEY = "sb_publishable_erR0w4XFiZeD08Hsbo5zIw_GcsdkMIl";

// Load supabase client (v2) and Chart.js via CDN in HTML pages.
// Initialize client
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

// Utility: format currency
function fmt(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function pct(n){ return (Number(n)*100).toFixed(2) + "%"; }

// Theme toggle
function initTheme(){
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
