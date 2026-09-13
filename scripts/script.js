// AetherCode TRPL 1A — interactions (Swiss print build)
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Toast (defined early, used by form/links) ---------- */
  const showToast = (message, type = 'info', duration = 3200) => {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'status');
    const body = document.createElement('div');
    body.className = 'toast-content';
    body.textContent = message;
    const close = document.createElement('button');
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Tutup notifikasi');
    close.textContent = '×';
    const dismiss = () => {
      toast.classList.add('exiting');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 260);
    };
    close.addEventListener('click', dismiss);
    toast.append(body, close);
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) dismiss(); }, duration);
  };

  /* ---------- Navbar mobile + active link ---------- */
  const nav = $('#navMenu');
  const burger = $('#hamburger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('show');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  const links = $$('#navMenu a');
  links.forEach(l => l.addEventListener('click', () => {
    links.forEach(x => x.classList.remove('active'));
    l.classList.add('active');
    nav.classList.remove('show');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
  // Scrollspy
  const sections = ['home', 'tentang', 'materi', 'tugas', 'galeri', 'jadwal', 'anggota', 'kontak']
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
      $('.done-btn', c).textContent = isDone ? 'Selesai — klik untuk batal' : 'Tandai selesai';
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
    if (e.target.tagName === 'INPUT') return;
    const inp = $('input', t);
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
      $('#nextTaskName').textContent = 'Semua tugas selesai';
      $('#heroDeadline').textContent = 'Nihil — semua beres';
      ['cdD', 'cdH', 'cdM', 'cdS'].forEach(id => document.getElementById(id).textContent = '0');
      return;
    }
    $('#nextTaskName').textContent = nxt.name + ' / ' + nxt.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase();
    $('#heroDeadline').textContent = nxt.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    let diff = nxt.date - new Date();
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    $('#cdD').textContent = d; $('#cdH').textContent = h; $('#cdM').textContent = m; $('#cdS').textContent = s;
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Jadwal: highlight hari ini ---------- */
  const today = new Date().getDay();
  const row = document.querySelector('#jadwalBody tr[data-day="' + today + '"]');
  if (row) {
    row.classList.add('today');
    const hint = $('#jadwalHint');
    if (hint) hint.textContent = 'Hari ini: ' + row.cells[1].textContent + ' (' + row.cells[2].textContent + ').';
  }

  /* ---------- Anggota: 32 data + search + tambah (monogram inisial) ---------- */
  const baseMembers = [
    ['Rizky Pratama', 'Ketua Kelas'], ['Salsabila Zahra', 'Sekretaris'], ['Dimas Arya', 'Bendahara'],
    ['Putri Ayu Lestari', 'Sekretaris'], ['Bagas Nugroho', 'Koordinator'], ['Nabila Putri', 'Anggota'],
    ['Fajar Ramadhan', 'Anggota'], ['Intan Permata', 'Anggota'], ['Yoga Saputra', 'Anggota'],
    ['Dewi Anggraini', 'Anggota'], ['Aldi Hermawan', 'Anggota'], ['Kirana Dewi', 'Anggota'],
    ['Ilham Maulana', 'Anggota'], ['Anisa Rahma', 'Anggota'], ['Reza Fahlevi', 'Anggota'],
    ['Wulan Sari', 'Anggota'], ['Farhan Aziz', 'Anggota'], ['Tiara Andini', 'Anggota'],
    ['Galih Prasetyo', 'Anggota'], ['Ayu Wandira', 'Anggota'], ['Rangga Firmansyah', 'Anggota'],
    ['Lutfi Hidayat', 'Anggota'], ['Mega Lestari', 'Anggota'], ['Naufal Rizki', 'Anggota'],
    ['Olivia Hartono', 'Anggota'], ['Pandji Kusuma', 'Anggota'], ['Qori Amelia', 'Anggota'],
    ['Raka Aditya', 'Anggota'], ['Sinta Bella', 'Anggota'], ['Teguh Santoso', 'Anggota'],
    ['Ulfa Mazaya', 'Anggota'], ['Vino Bastian', 'Anggota'],
  ];
  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const customKey = 'aether-members-custom';
  let custom = JSON.parse(localStorage.getItem(customKey) || '[]');
  const list = $('#anggotaList');

  function renderMembers(filter = '') {
    list.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const all = [...baseMembers.map(([n, r]) => ({ n, r, custom: false })), ...custom];
    const shown = all.filter(m => (m.n + ' ' + m.r).toLowerCase().includes(q));
    shown.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'card member' + (m.custom ? ' custom' : '');
      const star = m.r !== 'Anggota' ? ' star' : '';
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Hapus';
      del.setAttribute('aria-label', 'Hapus ' + m.n);
      del.textContent = '×';
      const av = document.createElement('div');
      av.className = 'm-avatar';
      av.setAttribute('aria-hidden', 'true');
      av.textContent = initials(m.n);
      const nm = document.createElement('strong');
      nm.textContent = m.n;
      const role = document.createElement('span');
      role.className = 'role' + star;
      role.textContent = m.r.toUpperCase();
      div.append(del, av, nm, role);
      if (m.custom) {
        del.addEventListener('click', () => {
          custom = custom.filter(x => !(x.n === m.n && x.r === m.r));
          localStorage.setItem(customKey, JSON.stringify(custom));
          renderMembers($('#searchAnggota').value);
        });
      }
      list.appendChild(div);
    });
    $('#anggotaCount').textContent = shown.length + ' ORANG' + (q ? ' / "' + filter.trim().toUpperCase() + '"' : '');
  }
  renderMembers();
  $('#searchAnggota').addEventListener('input', e => renderMembers(e.target.value));

  function tambahAnggota() {
    const input = $('#namaInput'), peran = $('#peranInput').value;
    const nama = input.value.trim();
    if (!nama) { showToast('Isi nama dulu sebelum menambah.', 'warning'); input.focus(); return; }
    custom.push({ n: nama, r: peran, custom: true });
    localStorage.setItem(customKey, JSON.stringify(custom));
    input.value = ''; input.focus();
    renderMembers($('#searchAnggota').value);
    showToast('Anggota baru tercatat: ' + nama, 'success');
  }
  $('#btnTambah').addEventListener('click', tambahAnggota);
  $('#namaInput').addEventListener('keydown', e => { if (e.key === 'Enter') tambahAnggota(); });

  /* ---------- Form kontak: validasi inline ---------- */
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const nama = $('#cfNama').value.trim();
    const email = $('#cfEmail').value.trim();
    const pesan = $('#cfPesan').value.trim();
    let valid = true;
    const setErr = (id, msg) => {
      document.querySelector('[data-err="' + id + '"]').textContent = msg || '';
      if (msg) valid = false;
    };
    setErr('cfNama', nama ? '' : 'Nama wajib diisi.');
    setErr('cfEmail', !email ? 'Email wajib diisi.' : (!emailOk(email) ? 'Format email tidak valid.' : ''));
    setErr('cfPesan', pesan.length < 10 ? 'Pesan minimal 10 karakter.' : '');
    const msg = $('#formMsg');
    if (!valid) { msg.textContent = ''; msg.classList.remove('ok'); return; }
    msg.textContent = 'Tercatat. Terima kasih, ' + nama + ' — pesan diteruskan ke pengurus (mode demo).';
    msg.classList.add('ok');
    showToast('Pesan terkirim ke pengurus.', 'success');
    e.target.reset();
  });
  $('#waLink').addEventListener('click', e => { e.preventDefault(); showToast('Ganti href tombol ini dengan link invite grup WA kelas.', 'info'); });
  $('#ghLink').addEventListener('click', e => { e.preventDefault(); showToast('Ganti href dengan URL organisasi GitHub kelas.', 'info'); });

  /* ---------- Back to top + footer year ---------- */
  const toTop = $('#toTop');
  window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 500), { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#year').textContent = new Date().getFullYear();

  console.log('AetherCode TRPL 1A loaded.');
})();
