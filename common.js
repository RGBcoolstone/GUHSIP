// Needs config.js loaded first (it holds your Supabase URL and key).
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let me = null;

// Shown only if logo.png is missing
const FB = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="34" cy="50" r="6" fill="#a3ff12"/><circle cx="50" cy="50" r="6" fill="#a3ff12"/><circle cx="66" cy="50" r="6" fill="#a3ff12"/></svg>');
const logo = c => `<img class="${c}" src="logo.png" alt="GUHSIP logo" onerror="this.onerror=null;this.src=FB">`;
const WORD = 'GUHSI<b>P</b>';
document.head.insertAdjacentHTML('beforeend', '<link rel="icon" href="logo.png">');
const COMMS = [['miva', 'MIVA'], ['reviews', 'Reviews'], ['campus', 'Campus'], ['music', 'Music'], ['sports', 'Sports'], ['gaming', 'Gaming'], ['tech', 'Tech'], ['entertainment', 'Entertainment'], ['relationships', 'Relationships']];
const cname = id => (COMMS.find(c => c[0] === id) || [0, id])[1];

const ICON = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
};
const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const link = (h, i, t) => `<a href="${h}" class="${location.pathname.endsWith(h) ? 'on' : ''}">${ico(i)}<span>${t}</span></a>`;

// Adds the left menu on every page. guard(true) = don't force login (used by the rules page).
async function guard(optional) {
  const { data } = await sb.auth.getSession();
  if (!data.session) { if (!optional) location.href = 'index.html'; return null; }
  me = data.session.user.id;
  document.body.classList.add('has-side');
  document.body.insertAdjacentHTML('afterbegin',
    `<aside class="side"><a class="brand" href="feed.html">${logo('mini')}<span class="word">${WORD}</span></a>
     <nav>${link('feed.html', 'home', 'Home')}${link('profile.html', 'user', 'Profile')}${link('rules.html', 'book', 'Rules')}
     <button id="out">${ico('out')}<span>Log out</span></button></nav></aside>
     <a class="top" href="feed.html">${logo('mini')}<span class="word">${WORD}</span></a>`);
  $('out').onclick = async () => { await sb.auth.signOut(); location.href = 'index.html'; };
  sb.from('admins').select('user_id').maybeSingle().then(({ data: a }) => {
    if (a) $('out').insertAdjacentHTML('beforebegin', link('admin.html', 'shield', 'Admin'));
  });
  return me;
}

const SEL = 'id,body,image_url,created_at,author_id,community_id,post_type,rating,profiles!author_id(username,avatar_url),surprises(user_id),comments(count)';
const TYPES = { gist: 'Gist', review: 'Review', fun: 'Fun', question: 'Question' };
const avatar = (url, u, c = 'av') => url ? `<img class="${c}" src="${esc(url)}" alt="">` : `<span class="${c}">${esc(u).charAt(0).toUpperCase()}</span>`;
const badge = p => p.post_type && p.post_type !== 'gist' ? `<span class="tag2">${TYPES[p.post_type] || ''}${p.rating ? ' ' + '\u2605'.repeat(p.rating) + '\u2606'.repeat(5 - p.rating) : ''}</span>` : '';
const sur = n => `${n} surprise${n === 1 ? '' : 's'}`;


function card(p) {
  const mine = p.surprises.some(s => s.user_id === me), n = p.surprises.length, u = esc(p.profiles?.username);
  return `<article class="card" data-id="${p.id}">
    <div class="who">${avatar(p.profiles?.avatar_url, p.profiles?.username)}
      <div><a href="profile.html?u=${u}">@${u}</a><div class="meta">in ${esc(cname(p.community_id))}, ${new Date(p.created_at).toLocaleString()}</div></div></div>
    ${badge(p)}
    ${p.body ? `<p>${esc(p.body)}</p>` : ''}
    ${p.image_url ? `<img class="pic" src="${esc(p.image_url)}" alt="" loading="lazy">` : ''}
    <div class="acts">
      <button data-a="sur" data-n="${n}" class="sur ${mine ? 'on' : ''}">😮 <span>${sur(n)}</span></button>
      <button data-a="com">Comments <span>${p.comments[0]?.count || 0}</span></button>
      <a class="pill" href="report.html?p=${p.id}">Report</a>
      ${p.author_id === me ? '<button data-a="del">Delete</button>' : ''}
    </div><div class="cbox" hidden></div></article>`;
}

async function load(el, filter, empty) {
  let q = sb.from('posts').select(SEL).order('created_at', { ascending: false }).limit(50);
  if (filter) q = filter(q);
  const { data, error } = await q;
  el.innerHTML = error ? `<p class="muted">Could not load posts: ${esc(error.message)}</p>`
    : data.length ? data.map(card).join('') : `<p class="muted">${empty || 'No sips yet.'}</p>`;
}

async function openComments(c, id) {
  const box = c.querySelector('.cbox');
  box.hidden = !box.hidden; if (box.hidden) return;
  const { data } = await sb.from('comments').select('body,profiles!author_id(username)').eq('post_id', id).order('created_at');
  box.innerHTML = (data || []).map(x => `<p class="cm"><a href="profile.html?u=${esc(x.profiles?.username)}">@${esc(x.profiles?.username)}</a> ${esc(x.body)}</p>`).join('')
    + '<form class="cf"><input maxlength="500" placeholder="Add a comment" required><button class="btn sm">Send</button></form>';
  box.querySelector('form').onsubmit = async ev => {
    ev.preventDefault();
    const t = ev.target.querySelector('input').value.trim(); if (!t) return;
    const r = await sb.from('comments').insert({ post_id: id, body: t });
    if (r.error) return alert('Could not comment. You may be banned, or try again.');
    const n = c.querySelector('[data-a="com"] span'); n.textContent = +n.textContent + 1;
    box.hidden = true; openComments(c, id);
  };
}

// Each page defines refresh() to reload itself
document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const c = b.closest('.card'), id = c.dataset.id, a = b.dataset.a;
  if (a === 'sur') {
    const on = b.classList.toggle('on'), n = +b.dataset.n + (on ? 1 : -1);
    b.dataset.n = n; b.querySelector('span').textContent = sur(n);
    b.classList.remove('pop'); void b.offsetWidth; if (on) b.classList.add('pop');
    const r = on ? await sb.from('surprises').insert({ post_id: id }) : await sb.from('surprises').delete().match({ post_id: id, user_id: me });
    if (r.error) refresh();
  }
  if (a === 'com') openComments(c, id);
  if (a === 'del' && confirm('Delete this post?')) {
    await sb.from('posts').delete().eq('id', id);
    if (window.afterDelete) afterDelete(); else refresh();
  }
});
