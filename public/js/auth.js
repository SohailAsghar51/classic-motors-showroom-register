// ===== Authentication helper =====
// NOTE: This is a static, front-end-only app (no server/database).
// So this login is a *client-side access gate*, not a real secure
// server-side authentication system. Anyone with access to this file
// could technically read the credentials in the source code.
// For genuine secure login, a backend (Node/PHP + database, hashed
// passwords, sessions) would be required.

const VALID_USER = 'admin';
const VALID_PASS = '1122';

function checkCredentials(u, p){
  return u === VALID_USER && p === VALID_PASS;
}
function isLoggedIn(){
  return sessionStorage.getItem('cm_logged_in') === 'yes';
}
function setLoggedIn(val){
  if(val) sessionStorage.setItem('cm_logged_in', 'yes');
  else sessionStorage.removeItem('cm_logged_in');
}
function requireLogin(){
  if(!isLoggedIn()){
    window.location.href = 'login.html';
  }
}
