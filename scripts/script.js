// AetherCode TRPL 1A — interactions
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Theme (dark/light) ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const savedTheme = localStorage.getItem('aether-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  const syncIcon = () => { themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; };
  syncIcon();
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('aether-theme', next);
    syncIcon();
  });

  /* ---------- Navbar mobile + active link ---------- */
  const nav = $('#navMenu');
  $('#hamburger').addEventListener('click', () => nav.classList.toggle('show'));
  const links = $$('#navMenu a');
  links.forEach(l => l.addEventListener('click', () => {
    links.forEach(x => x.classList.remove('active'));
    l.classList.add('active');
    nav.classList.remove('show');
  }));
  // Scrollspy
  const sections = ['home','tentang','materi','tugas','galeri','jadwal','anggota','kontak']
    .map(id => document.getElementById(id)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(x => x.classList.toggle('active', x.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count;
      let cur = 0; const step = Math.max(1, Math.round(target / 40));
      const t = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(t); } el.textContent = cur; }, 40);
      cObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cObs.observe(el));

  /* ---------- Materi: filter + selesai ---------- */
  const mCards = $$('#materiGrid .materi');
  $$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    mCards.forEach(c => { c.style.display = (f === 'all' || c.dataset.cat === f) ? '' : 'none'; });
  }));
  const doneKey = 'aether-materi-done';
  let done = new Set(JSON.parse(localStorage.getItem(doneKey) || '[]'));
  const paintMateri = () => {
    mCards.forEach(c => {
      const isDone = done.has(c.dataset.id);
      c.classList.toggle('done', isDone);
      $('.done-btn', c).textContent = isDone ? 'Selesai ✓ — klik untuk batal' : 'Tandai selesai ✓';
    });
    const pct = Math.round((done.size / mCards.length) * 100);
    $('#materiFill').style.width = pct + '%';
    $('#materiPct').textContent = pct + '% (' + done.size + '/' + mCards.length + ')';
  };
  mCards.forEach(c => $('.done-btn', c).addEventListener('click', () => {
    done.has(c.dataset.id) ? done.delete(c.dataset.id) : done.add(c.dataset.id);
    localStorage.setItem(doneKey, JSON.stringify([...done]));
    paintMateri();
  }));
  paintMateri();

  /* ---------- Galeri filter ---------- */
  $$('[data-gfilter]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-gfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.gfilter;
    $$('#galleryGrid .g-item').forEach(g => { g.style.display = (f === 'all' || g.dataset.gcat === f) ? '' : 'none'; });
  }));

  /* ---------- Tugas: checklist + countdown ---------- */
  const taskKey = 'aether-tasks-done';
  let tasksDone = new Set(JSON.parse(localStorage.getItem(taskKey) || '[]'));
  const tasks = $$('#taskList .task');
  const paintTasks = () => {
    tasks.forEach(t => {
      const id = $('input', t).dataset.task;
      t.classList.toggle('checked', tasksDone.has(id));
      $('input', t).checked = tasksDone.has(id);
    });
  };
  tasks.forEach(t => t.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return; // biar label toggle alami, kita sinkron setelahnya
    const inp = $('input', t);
    // toggle manual karena klik div
    setTimeout(() => {
      inp.checked ? tasksDone.add(inp.dataset.task) : tasksDone.delete(inp.dataset.task);
      localStorage.setItem(taskKey, JSON.stringify([...tasksDone]));
      paintTasks(); tick();
    }, 0);
  }));
  $$('#taskList input').forEach(inp => inp.addEventListener('change', () => {
    inp.checked ? tasksDone.add(inp.dataset.task) : tasksDone.delete(inp.dataset.task);
    localStorage.setItem(taskKey, JSON.stringify([...tasksDone]));
    paintTasks(); tick();
  }));
  paintTasks();

  function nextDeadline() {
    const now = new Date();
    const upcoming = tasks
      .map(t => ({ el: t, date: new Date(t.dataset.deadline), name: $('.task-body strong', t).textContent }))
      .filter(o => o.date > now && !tasksDone.has($('input', o.el).dataset.task))
      .sort((a, b) => a.date - b.date);
    return upcoming[0] || null;
  }
  function tick() {
    const nxt = nextDeadline();
    if (!nxt) {
      $('#nextTaskName').textContent = 'Semua tugas selesai 🎉';
      $('#heroDeadline').textContent = 'tidak ada 🎉';
      ['cdD','cdH','cdM','cdS'].forEach(id => document.getElementById(id).textContent = '0');
      return;
    }
    $('#nextTaskName').textContent = nxt.name + ' • ' + nxt.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    $('#heroDeadline').textContent = nxt.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    let diff = nxt.date - new Date();
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    $('#cdD').textContent = d; $('#cdH').textContent = h; $('#cdM').textContent = m; $('#cdS').textContent = s;
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Anggota: 32 dummy + search + tambah ---------- */
  const AVATARS = ['🧑‍💻','👩‍💻','🧑‍🎓','👩‍🎓','🧑‍🔬','👩‍🔬','🧑‍🎨','👩‍🎨'];
  const baseMembers = [
    ['Rizky Pratama','Ketua Kelas'], ['Salsabila Zahra','Sekretaris'], ['Dimas Arya','Bendahara'],
    ['Putri Ayu Lestari','Sekretaris'], ['Bagas Nugroho','Koordinator'], ['Nabila Putri','Anggota'],
    ['Fajar Ramadhan','Anggota'], ['Intan Permata','Anggota'], ['Yoga Saputra','Anggota'],
    ['Dewi Anggraini','Anggota'], ['Aldi Hermawan','Anggota'], ['Kirana Dewi','Anggota'],
    ['Ilham Maulana','Anggota'], ['Anisa Rahma','Anggota'], ['Reza Fahlevi','Anggota'],
    ['Wulan Sari','Anggota'], ['Farhan Aziz','Anggota'], ['Tiara Andini','Anggota'],
    ['Galih Prasetyo','Anggota'], ['Ayu Wandira','Anggota'], ['Rangga Firmansyah','Anggota'],
    ['Lutfi Hidayat','Anggota'], ['Mega Lestari','Anggota'], ['Naufal Rizki','Anggota'],
    ['Olivia Hartono','Anggota'], ['Pandji Kusuma','Anggota'], ['Qori Amelia','Anggota'],
    ['Raka Aditya','Anggota'], ['Sinta Bella','Anggota'], ['Teguh Santoso','Anggota'],
    ['Ulfa Mazaya','Anggota'], ['Vino Bastian','Anggota'],
  ];
  const customKey = 'aether-members-custom';
  let custom = JSON.parse(localStorage.getItem(customKey) || '[]');
  const list = $('#anggotaList');

  function renderMembers(filter = '') {
    list.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const all = [...baseMembers.map(([n, r]) => ({ n, r, custom: false })), ...custom];
    const shown = all.filter(m => (m.n + ' ' + m.r).toLowerCase().includes(q));
    shown.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'card member' + (m.custom ? ' custom' : '');
      const star = m.r !== 'Anggota' ? ' star' : '';
      div.innerHTML =
        '<button class="del" title="Hapus">✕</button>' +
        '<div class="m-avatar">' + AVATARS[(m.n.length + i) % AVATARS.length] + '</div>' +
        '<strong></strong><span class="role' + star + '"></span>';
      $('strong', div).textContent = m.n;
      $('.role', div).textContent = m.r;
      if (m.custom) {
        $('.del', div).addEventListener('click', () => {
          custom = custom.filter(x => !(x.n === m.n && x.r === m.r));
          localStorage.setItem(customKey, JSON.stringify(custom));
          renderMembers($('#searchAnggota').value);
        });
      }
      list.appendChild(div);
    });
    $('#anggotaCount').textContent = shown.length + ' orang' + (q ? ' • hasil "' + filter.trim() + '"' : '');
  }
  renderMembers();
  $('#searchAnggota').addEventListener('input', e => renderMembers(e.target.value));

  function tambahAnggota() {
    const input = $('#namaInput'), peran = $('#peranInput').value;
    const nama = input.value.trim();
    if (!nama) { alert('Isi nama dulu!'); input.focus(); return; }
    custom.push({ n: nama, r: peran, custom: true });
    localStorage.setItem(customKey, JSON.stringify(custom));
    input.value = ''; input.focus();
    renderMembers($('#searchAnggota').value);
  }
  $('#btnTambah').addEventListener('click', tambahAnggota);
  $('#namaInput').addEventListener('keydown', e => { if (e.key === 'Enter') tambahAnggota(); });
  window.tambahAnggota = tambahAnggota; // kompatibel dgn onclick lama

  /* ---------- Piket hari ini ---------- */
  const piket = { 1: 'Kel. 1 (Senin)', 2: 'Kel. 2 (Selasa)', 3: 'Kel. 3 (Rabu)', 4: 'Kel. 4 (Kamis)', 5: 'Kel. 5 (Jumat)', 6: 'Libur 🎉', 0: 'Libur 🎉' };
  $('#piketToday').textContent = piket[new Date().getDay()];

  /* ---------- Form kontak (demo) ---------- */
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const nama = $('#cfNama').value.trim();
    $('#formMsg').textContent = 'Terima kasih, ' + (nama || 'teman') + '! Pesanmu tercatat (demo — hubungkan ke backend/WA untuk produksi). ✅';
    e.target.reset();
    setTimeout(() => $('#formMsg').textContent = '', 5000);
  });
  $('#waLink').addEventListener('click', e => { e.preventDefault(); alert('Ganti href tombol ini dengan link invite Grup WA kelas.'); });
  $('#ghLink').addEventListener('click', e => { e.preventDefault(); alert('Ganti href dengan URL organisasi GitHub kelas.'); });

  /* ---------- Back to top + footer year ---------- */
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 500));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#year').textContent = new Date().getFullYear();

  console.log('AetherCode TRPL 1A loaded ✅');
})();
