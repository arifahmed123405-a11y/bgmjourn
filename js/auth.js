// Auth flows for index.html and logout buttons on other pages
document.addEventListener("DOMContentLoaded", async () => {
  // Buttons on index page
  const loginBtn = document.getElementById("btn-login");
  const signupBtn = document.getElementById("btn-signup");
  const magicBtn = document.getElementById("btn-magic");
  const guestBtn = document.getElementById("btn-guest");

  if(loginBtn){
    loginBtn.onclick = async () => {
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-pass").value;
      const msg = document.getElementById("login-msg");
      msg.textContent = "Signing in…";
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if(error){ msg.textContent = error.message; return; }
      msg.textContent = "Signed in. Redirecting…";
      setTimeout(()=> location.href = "dashboard.html", 700);
    };
  }

  if(signupBtn){
    signupBtn.onclick = async () => {
      const email = document.getElementById("signup-email").value;
      const pass = document.getElementById("signup-pass").value;
      const msg = document.getElementById("signup-msg");
      msg.textContent = "Creating account…";
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if(error){ msg.textContent = error.message; return; }
      msg.textContent = "Account created. Check email for confirmation.";
    };
  }

  if(magicBtn){
    magicBtn.onclick = async () => {
      const email = document.getElementById("magic-email").value;
      const msg = document.getElementById("signup-msg") || document.getElementById("login-msg");
      msg.textContent = "Sending magic link…";
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if(error){ msg.textContent = error.message; return; }
      msg.textContent = "Magic link sent. Check your inbox.";
    };
  }

  if(guestBtn){
    guestBtn.onclick = async () => {
      // Create an anonymous session using a throwaway email (not secure) — better to use real sign up.
      const email = `guest+${Date.now()}@example.com`;
      const pass = Math.random().toString(36).slice(2);
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if(error){ alert(error.message); return; }
      alert("Guest created. Check your email to confirm or use the app as guest.");
    };
  }

  // Logout buttons on other pages
  const logoutBtns = document.querySelectorAll("#btn-logout");
  logoutBtns.forEach(b => b && (b.onclick = async () => {
    await supabase.auth.signOut();
    location.href = "index.html";
  }));

  // If user already signed in, redirect from index to dashboard
  if(location.pathname.endsWith("index.html") || location.pathname === "/" ){
    const { data } = await supabase.auth.getSession();
    if(data.session) location.href = "dashboard.html";
  }
});
