// ── Netlify Identity redirect ──────────────────────────────────────────
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', user => {
    if (!user) {
      window.netlifyIdentity.on('login', () => {
        document.location.href = '/admin/';
      });
    }
  });
}

// ── Blog ──────────────────────────────────────────────────────────────
let postsData = [];

async function renderBlog() {
  const grid = document.getElementById('blog-grid');
  try {
    const res  = await fetch('/posts/index.json');
    const data = await res.json();
    // CMS now writes { "posts": [...] }
    postsData = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('Failed to load posts:', err);
    grid.innerHTML = `<div class="blog-empty"><span>⚠</span>Could not load posts.</div>`;
    return;
  }

  if (!postsData.length) {
    grid.innerHTML = `<div class="blog-empty"><span>✍</span>No posts yet. Check back soon.</div>`;
    return;
  }

  grid.innerHTML = postsData.map((p, i) => `
    <div class="blog-card" onclick="openPost(${i})">
      <div class="blog-meta">
        <span class="blog-date">${formatDate(p.date)}</span>
        ${p.category ? `<span class="blog-category">${escHtml(p.category)}</span>` : ''}
      </div>
      <div class="blog-title">${escHtml(p.title)}</div>
      <div class="blog-excerpt">${escHtml(p.excerpt || stripMd(p.body).slice(0, 160) + '…')}</div>
      <div class="blog-read-more">Read more</div>
    </div>
  `).join('');
}

function openPost(index) {
  const post = postsData[index];
  if (!post) return;
  document.getElementById('pv-category').textContent = post.category || '';
  document.getElementById('pv-title').textContent    = post.title;
  document.getElementById('pv-date').textContent     = formatDate(post.date);
  // Render markdown safely
  document.getElementById('pv-body').innerHTML =
    DOMPurify.sanitize(marked.parse(post.body || ''));
  document.getElementById('post-overlay').classList.add('open');
  window.scrollTo(0, 0);
}

function closePost() {
  document.getElementById('post-overlay').classList.remove('open');
}

// Strip markdown for plain-text excerpt preview
function stripMd(s) {
  return (s || '').replace(/[#*_`>\[\]!]/g, '').replace(/\n+/g, ' ').trim();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Contact form (AJAX — no Formspree redirect) ───────────────────────
async function handleContact(e) {
  e.preventDefault();
  const form   = document.getElementById('contact-form');
  const btn    = document.getElementById('form-btn');
  const status = document.getElementById('form-status');

  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.style.display = 'none';

  try {
    const res = await fetch('https://formspree.io/f/mgopegpr', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form),
    });

    if (res.ok) {
      status.style.cssText = 'display:block;padding:16px 20px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:.78rem;background:rgba(0,229,160,.08);border:1px solid rgba(0,229,160,.25);color:#00e5a0;';
      status.textContent = '✓ Message sent — I\'ll get back to you as soon as possible.';
      form.reset();
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  } catch (err) {
    status.style.cssText = 'display:block;padding:16px 20px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:.78rem;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.25);color:#ff7070;';
    status.textContent = '✗ ' + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Message →';
  }
}

// ── Navbar scroll ──────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ── ESC closes post view ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePost();
});

// ── Typewriter ─────────────────────────────────────────────────────────
const phrases = [
  'git commit -m "ship it"',
  'while(true) { learn(); }',
  'sudo make me a sandwich',
  'ssh user@opportunity.dev',
  'grep -r "passion" ./work/',
];
let phraseIdx = 0, charIdx = 0, deleting = false;
function typeStep() {
  const phrase = phrases[phraseIdx];
  const el = document.getElementById('typed-text');
  if (!deleting) {
    el.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) { deleting = true; setTimeout(typeStep, 1800); return; }
  } else {
    el.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; }
  }
  setTimeout(typeStep, deleting ? 40 : 70);
}
setTimeout(typeStep, 1200);

// ── Scroll animations ──────────────────────────────────────────────────
const observer = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.1 }
);
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
document.querySelectorAll('.skill-card, .project-card').forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
});

// ── Footer year ────────────────────────────────────────────────────────
document.getElementById('footer-year').textContent = `© ${new Date().getFullYear()}`;

// ── Init ───────────────────────────────────────────────────────────────
renderBlog();