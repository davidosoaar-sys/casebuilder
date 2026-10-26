// Shared sidebar + the unchanged "Needs attention" list, so each concept is judged in place.
document.querySelector('.sidebar').innerHTML = `
  <div class="logo">Case<span>Builder</span></div>
  <nav class="nav"><a class="on"><i></i>Dashboard</a><a><i></i>Projects</a><a><i></i>Scheduled</a><a><i></i>Skills</a><a><i></i>Connectors</a></nav>`
document.querySelectorAll('[data-rows]').forEach(el => { el.innerHTML = `
  <div class="section-h in d4"><h2>Needs attention</h2><span>Least confirmed first</span></div>
  <div class="rows in d5">
    <div class="row"><div class="mark" style="background:#a3aaae">A</div><div><b>Apple</b><small>No roles have a person yet</small></div>
      <div><div class="bar"><span class="e" style="width:100%"></span></div><small>0 confirmed of 26</small></div><div class="val muted">Not enough inputs to value yet</div><button class="btn">Fill 22 inputs</button></div>
    <div class="row"><div class="mark" style="background:#1ed760">S</div><div><b>Spotify</b><small>1 of 4 roles has a person. No CTO yet</small></div>
      <div><div class="bar"><span class="s" style="width:12%"></span><span class="e" style="width:88%"></span></div><small>3 suggested, 23 empty</small></div><div class="val muted">Not enough inputs to value yet</div><button class="btn primary">Review 3 suggestions</button></div>
    <div class="row"><div class="mark" style="background:#1434cb;color:#fff">V</div><div><b>Visa</b><small>2 of 4 roles have a person. No finance lead yet</small></div>
      <div><div class="bar"><span class="c" style="width:31%"></span><span class="a" style="width:42%"></span><span class="s" style="width:8%"></span><span class="e" style="width:19%"></span></div><small>8 confirmed, 11 assumed</small></div><div class="val">$1.4M to $8.3M a year</div><button class="btn">Find the VP of Engineering</button></div>
  </div>` })
document.querySelector('.replay')?.addEventListener('click', () => { document.querySelectorAll('.in, [data-anim]').forEach(e => { e.style.animation = 'none'; e.offsetHeight; e.style.animation = '' }); window.replay?.() })
