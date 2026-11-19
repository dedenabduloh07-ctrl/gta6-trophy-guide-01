// Leonida Trophy Guide — GTA VI (PS5). Offline static app: no network requests,
// no external assets. Progress lives in localStorage; export/import is a JSON file.
const KEY = 'gta6-trophy-progress-v1';
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

let doc = null;
let earned = new Set();
let selectedId = 1;

try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
function save() { localStorage.setItem(KEY, JSON.stringify([...earned])); }

const SOURCE_LABELS = {
  exophase: 'Exophase — name, description and grade',
  psnprofiles: 'PSNProfiles — name, description, grade, PSN target and rarity',
  outputlag: 'Output Lag (community guide) — gameplay method, not yet checked in the game',
};
const SOURCE_URLS = {
  exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  psnprofiles: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  outputlag: 'https://outputlag.com/guides/gta-6-trophy-list/',
};

function rarityLabel(pct) {
  const v = parseFloat(pct);
  if (v >= 50) return 'Common';
  if (v >= 20) return 'Uncommon';
  if (v >= 10) return 'Rare';
  if (v >= 5) return 'Very Rare';
  return 'Ultra Rare';
}
function stars(n) {
  if (n == null) return 'not rated yet';
  return '★'.repeat(n) + '☆'.repeat(5 - n) + ` (${n}/5, our estimate)`;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function spoilersOn() { return $('spoilers').checked; }
function isHidden(t) { return spoilersOn() && t.hidden && !earned.has(t.name); }

function filtered() {
  const q = $('q').value.trim().toLowerCase();
  const grade = $('grade').value;
  const kind = $('kind').value;
  const diff = $('difficulty').value;
  const status = $('status').value;
  const sort = $('sort').value;
  let list = doc.trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.category !== kind) return false;
    if (diff !== 'all' && String(t.difficulty) !== diff) return false;
    if (status === 'earned' && !earned.has(t.name)) return false;
    if (status === 'remaining' && earned.has(t.name)) return false;
    if (status === 'missable' && !t.missable) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
  const byRarity = (a, b) => parseFloat(a.rarity_site) - parseFloat(b.rarity_site);
  if (sort === 'rarest') list = [...list].sort(byRarity);
  else if (sort === 'easiest') list = [...list].sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
  else if (sort === 'hardest') list = [...list].sort((a, b) => (b.difficulty ?? -1) - (a.difficulty ?? -1));
  else if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderProgress() {
  const total = doc.trophies.length;
  const n = earned.size;
  $('earnedCount').textContent = n;
  $('progressFill').style.width = `${(n / total) * 100}%`;
  const g = doc.trophies.filter((t) => earned.has(t.name)).reduce((s, t) => s + t.gamerscore, 0);
  $('gamerscore').textContent = `${g.toLocaleString()}G`;
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('gradeCounts').textContent = grades.map((gr) => {
    const have = doc.trophies.filter((t) => t.grade === gr && earned.has(t.name)).length;
    const all = doc.trophies.filter((t) => t.grade === gr).length;
    return `${gr[0].toUpperCase() + gr.slice(1)} ${have}/${all}`;
  }).join(' · ');
  const kinds = ['story', 'side', 'collection'];
  $('categoryCounts').textContent = kinds.map((k) => {
    const have = doc.trophies.filter((t) => t.category === k && earned.has(t.name)).length;
    const all = doc.trophies.filter((t) => t.category === k).length;
    return `${k[0].toUpperCase() + k.slice(1)} ${have}/${all}`;
  }).join(' · ');
}

function renderList() {
  const list = filtered();
  const ul = $('trophies');
  ul.replaceChildren();
  $('showing').textContent = `Showing ${list.length} of ${doc.trophies.length} trophies · ${earned.size} earned overall`;
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No trophies match these filters.';
    ul.append(li);
    return;
  }
  for (const t of list) {
    const hidden = isHidden(t);
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (t.id === selectedId) li.classList.add('selected');
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${hidden ? 'hidden trophy' : t.name} as earned`);
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save();
      renderAll();
    });
    li.addEventListener('click', (e) => {
      // A click on the checkbox must not also re-render the list mid-click:
      // the row is rebuilt during bubbling, which would kill the checkbox's
      // own toggle. The checkbox's change handler owns that case.
      if (e.target instanceof HTMLInputElement) return;
      selectedId = t.id;
      renderAll();
    });
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') { selectedId = t.id; renderAll(); } });
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.title = t.grade;
    const body = document.createElement('div');
    body.className = 't-body';
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = hidden ? 'Hidden trophy' : t.name;
    if (!hidden) {
      if (t.missable) {
        const flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = 'MISSABLE';
        name.append(flag);
      }
      if (!t.verified) {
        const flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = 'METHOD NOT VERIFIED YET';
        name.append(flag);
      }
    }
    const desc = document.createElement('div');
    desc.className = 't-desc';
    desc.textContent = hidden ? 'Hidden on PlayStation until earned.' : t.description;
    const meta = document.createElement('div');
    meta.className = 't-meta';
    const bits = [
      `<b>${t.grade}</b>`,
      t.category,
      t.psn_target != null ? `PSN counts to ${t.psn_target.toLocaleString()}` : null,
      t.difficulty != null ? `Difficulty ${t.difficulty}/5` : 'Difficulty not rated',
      `Rarity ${t.rarity_psn} (${rarityLabel(t.rarity_psn)})`,
      `${t.gamerscore}G`,
    ].filter(Boolean);
    meta.innerHTML = bits.map((b) => `<span>${b}</span>`).join('');
    const guide = document.createElement('div');
    guide.className = 't-guide';
    guide.innerHTML = hidden ? '' : `<span>How:</span> ${esc(t.guide)}`;
    body.append(name, desc, meta, guide);
    li.append(box, medal, body);
    ul.append(li);
  }
}

function renderDetail() {
  const t = doc.trophies.find((x) => x.id === selectedId) ?? doc.trophies[0];
  const d = $('detail');
  const hidden = isHidden(t);
  const earnedNow = earned.has(t.name);
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = earnedNow;
  check.addEventListener('change', () => {
    if (check.checked) earned.add(t.name); else earned.delete(t.name);
    save();
    renderAll();
  });
  const label = document.createElement('label');
  label.className = 'check';
  label.style.cssText = 'display:flex;gap:6px;align-items:center;font-weight:600;';
  label.append(check, document.createTextNode(earnedNow ? 'Earned — ticked off' : 'Mark as earned'));
  d.replaceChildren();
  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = `Trophy ${t.id} of 55 · ${t.grade.toUpperCase()}`;
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Hidden on PlayStation until earned.' : `“${t.description}” — the official description.`;
  d.append(kicker, h, official);
  if (t.missable) {
    const c = document.createElement('div');
    c.className = 'callout';
    c.innerHTML = '<strong>Missable — the only one.</strong> Lucia&rsquo;s balcony meditation in Chapter 1 disappears after that chapter, and there is no mission replay. Do it in Chapter 1 and keep a Chapter 1 save until this trophy pops.';
    d.append(c);
  }
  if (!t.verified) {
    const c = document.createElement('div');
    c.className = 'callout';
    c.innerHTML = '<strong>No verified method yet.</strong> As of 19 November 2026 no reliable unlock method has been published for this trophy. This guide will be updated when one is confirmed — do not trust guesses.';
    d.append(c);
  }
  const chips = document.createElement('div');
  chips.className = 'chips';
  const chip = (cls, text) => { const s = document.createElement('span'); s.className = `chip ${cls}`; s.textContent = text; return s; };
  chips.append(
    chip(`grade-${t.grade}`, t.grade),
    chip('', t.category),
    chip('', t.hidden ? 'Hidden on PSN' : 'Visible on PSN'),
    chip('', `Difficulty: ${stars(t.difficulty)}`),
    chip('', `Time: ${t.time}`),
  );
  d.append(chips, label);
  const guide = document.createElement('div');
  guide.className = 'guide';
  const gh = document.createElement('h3');
  gh.textContent = 'How to earn it';
  const gp = document.createElement('p');
  gp.textContent = hidden ? 'Hidden until earned. Turn off “Hide story spoilers” to read this guide.' : t.guide;
  guide.append(gh, gp);
  d.append(guide);
  const stats = document.createElement('div');
  stats.className = 'stats';
  const rows = [
    ['PSN progress target', t.psn_target != null ? `0 / ${t.psn_target.toLocaleString()}` : '—'],
    ['PSN rarity (launch day)', `${t.rarity_psn} · ${rarityLabel(t.rarity_psn)}`],
    ['PSNProfiles rarity', `${t.rarity_site}`],
    ['Gamerscore (Xbox)', `${t.gamerscore}G`],
    ['Estimated difficulty', t.difficulty != null ? `${t.difficulty} / 5 (our estimate)` : 'Not rated — method not verified'],
  ];
  for (const [k, v] of rows) {
    const row = document.createElement('div');
    const a = document.createElement('span'); a.textContent = k;
    const b = document.createElement('b'); b.textContent = v;
    row.append(a, b);
    stats.append(row);
  }
  d.append(stats);
  const box = document.createElement('div');
  box.className = 'sources-box';
  const bh = document.createElement('h3');
  bh.textContent = 'How we know';
  box.append(bh);
  const ul = document.createElement('ul');
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = SOURCE_URLS[s];
    a.textContent = SOURCE_LABELS[s].split(' — ')[0];
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a, document.createTextNode(` — ${SOURCE_LABELS[s].split(' — ')[1]}`));
    ul.append(li);
  }
  box.append(ul);
  const note = document.createElement('p');
  note.style.cssText = 'margin:8px 0 0;color:var(--muted);font-size:12px;';
  note.textContent = 'Guide text is written in our own words. Trophy names and descriptions are the official list.';
  box.append(note);
  d.append(box);
}

const ROADMAP = [
  {
    title: 'Before you start: your saves',
    text: 'The game has 15 manual save slots plus one autosave. Keep one save at the start of each chapter and an untouched one from just before the final mission, and rotate the rest. There is no mission replay and no New Game Plus, and cheats switch off both trophies and saving — keep cheats off your trophy save.',
    covers: ['Saves', 'Positive Mental Attitude'],
  },
  {
    title: 'Play the story, Chapters 1–4',
    text: 'The 12 story trophies pop as you play, and chapter trophies can pop at the start of the next chapter rather than on the last cutscene. In Chapter 1, do Lucia’s balcony meditation (see Missables). In Chapter 3, race Yago the moment the time-sensitive race appears.',
    covers: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm'],
  },
  {
    title: 'Partners: Jason and Lucia together',
    text: 'Switching between Jason and Lucia opens right after Breakfast Run in Chapter 2. From then on, call the other one in as your partner: several trophies need the two of you together, and meditating with both characters at each outdoor spot counts double toward Positive Mental Attitude.',
    covers: ['Hot Together', 'Retail Therapy', 'Personal Best', 'Positive Mental Attitude'],
  },
  {
    title: 'Side strands and finales',
    text: 'Finish the side-story finales for Andy, Kenton, Billy, Randy and Tyrone — they stay open after the story. Then complete 8 stranger strands for Strangers & Freaks, remembering that Andy’s, Billy’s and Tyrone’s strands do not count toward it. Bret’s hunting questline is Jason-only.',
    covers: ['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks', 'Fair Game', 'Baited My Tackle'],
  },
  {
    title: 'Robberies and money',
    text: 'Jewelry stores open in Chapter 3, when Yasmani’s Jewelry Jobs gives you the Snap Gun. Armored trucks and bank vaults come later — vaults unlock through That’s Where The Money Is, an optional mission near the end of Chapter 4, and you cannot carry all the bags alone, so bring your partner. Rob one illegal operation from each of the 9 gangs, launder $250,000 of marked bills, buy the 8 garages, and register 10 vehicles with Scooter Bros.',
    covers: ['Sneakthief', 'A Classic Blitz Play', 'Maximum Withdrawal', 'Pest Control', 'Dime on the Dollar', 'Treat Yo Self', 'Little Boxes', 'On the Spot'],
  },
  {
    title: 'The long grind, then 100%',
    text: 'Now the counters: 250 stunts (300 for 100%), 42 Shooting Range gold medals, drone races at all 14 Top Fun locations, 20 race wins, 50 challenges (70 of 80 for 100%), 3 card sets, WAiNK It at 100 spots, 100 vehicles discovered (200 of 277 for 100%), all 52 areas, and 500 profile actions. The 100% checklist only appears after the story, under Progress > Stats > 100% Completion — but work you do earlier still counts. Finish A Long Road, and Vice Got a Price! follows.',
    covers: ['Cunning Stunts', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos', 'Master of None', 'Stick Fiddler', 'Don’t Touch My Deck', 'You WAiNKer!', 'One Last Thing', 'Whip It Good', 'The Goodtime State', 'Actions Speak Louder', 'In The Beginning…', 'Capital Offense', 'Let’s Go Bowling', 'Ten Pin', 'Catch Me If You Can', 'Challenging Tank', 'A Long Road', 'Vice Got a Price!'],
  },
];

function renderRoadmap() {
  const ol = $('roadmap');
  ol.replaceChildren();
  for (const step of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = step.title;
    const p = document.createElement('p');
    p.textContent = step.text;
    const c = document.createElement('p');
    c.className = 'covers';
    c.innerHTML = `<b>Covers ${step.covers.length}:</b> ${step.covers.map(esc).join(', ')}`;
    li.append(h, p, c);
    ol.append(li);
  }
}

function renderMissables() {
  const wrap = $('missables');
  wrap.replaceChildren();
  const cards = [
    {
      alert: true,
      title: 'Positive Mental Attitude — the one missable trophy',
      body: 'Meditate at every one of the 18 spots across Leonida. Lucia’s balcony meditation in Chapter 1 counts toward it and disappears after that chapter. There is no mission replay, so do it in Chapter 1 and keep a Chapter 1 save until the trophy pops. Meditation spots show as purple icons when you are close, and each outdoor spot should count twice if you meditate there with both characters — bring your partner every time.',
    },
    {
      alert: false,
      title: 'Race Against Yago — time-sensitive, not missable',
      body: 'This Chapter 3 race in Yago’s street racing strand is time-sensitive (hourglass icon) and the strand counts toward Strangers & Freaks. Save first, then race it the moment it appears.',
    },
  ];
  for (const c of cards) {
    const div = document.createElement('div');
    div.className = `miss-card${c.alert ? ' alert' : ''}`;
    const h = document.createElement('h3');
    h.textContent = c.title;
    const p = document.createElement('p');
    p.textContent = c.body;
    div.append(h, p);
    wrap.append(div);
  }
}

function renderSources() {
  const wrap = $('sources');
  wrap.replaceChildren();
  const cards = [
    {
      title: 'Exophase — the official list',
      body: 'Every trophy’s name, description and grade, checked against the list on Exophase on 19 November 2026. All 55 match.',
      url: SOURCE_URLS.exophase,
    },
    {
      title: 'PSNProfiles — the official list, plus PSN targets and rarity',
      body: 'Every name, description and grade again, plus PSN’s own progress targets (0/250 stunts, 0/42 range medals, 0/18 meditation spots, and the rest) and rarity percentages from launch day. The two trackers agree on every name, description and grade.',
      url: SOURCE_URLS.psnprofiles,
    },
    {
      title: 'Output Lag — gameplay methods (community guide)',
      body: 'The hidden-trophy split (27 visible, 28 hidden), the save rules, the Yago race warning, the ~200-hour platinum estimate, and the how-to for the robbery, partner and grind trophies. These are community reports, not checked in the game — each trophy that uses them says so.',
      url: SOURCE_URLS.outputlag,
    },
    {
      title: 'What we do not know yet',
      body: 'Two trophies have no verified unlock method as of 19 November 2026: Bad Luck, I Guess and The Truth Is Out There. Their pages say so plainly instead of guessing. Difficulty (1–5) and time estimates are our own estimates, labelled as such. Rarity percentages are from launch day and move fast.',
      url: null,
    },
  ];
  for (const c of cards) {
    const div = document.createElement('div');
    div.className = 'src-card';
    const h = document.createElement('h3');
    h.textContent = c.title;
    const p = document.createElement('p');
    p.textContent = c.body;
    div.append(h, p);
    if (c.url) {
      const a = document.createElement('a');
      a.href = c.url;
      a.textContent = c.url;
      a.target = '_blank';
      a.rel = 'noopener';
      const pl = document.createElement('p');
      pl.append(a);
      div.append(pl);
    }
    wrap.append(div);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
}

function showView(name) {
  for (const v of ['tracker', 'roadmap', 'missables', 'sources']) {
    $(`view-${v}`).hidden = v !== name;
  }
  for (const b of document.querySelectorAll('.tabs button')) {
    b.classList.toggle('active', b.dataset.view === name);
  }
}

document.querySelectorAll('.tabs button').forEach((b) => {
  b.addEventListener('click', () => showView(b.dataset.view));
});
for (const id of ['q', 'grade', 'kind', 'difficulty', 'status', 'sort']) {
  $(id).addEventListener('input', renderList);
  $(id).addEventListener('change', renderList);
}
$('spoilers').addEventListener('change', renderAll);

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const names = JSON.parse(await file.text());
    const valid = new Set(doc.trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => valid.has(n)));
    save();
    renderAll();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (confirm('Clear all ticked trophies?')) {
    earned = new Set();
    save();
    renderAll();
  }
});

doc = await (await fetch('data/trophies.json')).json();
if (params.get('view') && ['tracker', 'roadmap', 'missables', 'sources'].includes(params.get('view'))) {
  showView(params.get('view'));
}
if (params.get('spoilers') === 'off') $('spoilers').checked = false;
if (params.get('spoilers') === 'on') $('spoilers').checked = true;
const tid = Number(params.get('trophy'));
if (tid >= 1 && tid <= doc.trophies.length) selectedId = tid;
renderRoadmap();
renderMissables();
renderSources();
renderAll();
window.__shotReady = true;
