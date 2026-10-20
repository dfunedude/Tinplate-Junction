// ===== ui/dom: element lookup and the toast message =====

export const $ = id => document.getElementById(id);
export function toast(msg, ms = 2400) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, ms);
}
