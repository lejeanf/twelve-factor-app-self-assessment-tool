let factors = [];
let current = 0;
let answers = [];

function scoreInfo(score, max) {
  const r = score / max;
  if (r >= 0.85) return { label: 'Excellent alignment', color: 'var(--accent)',  cls: 'good',    dotCls: 'dot-good' };
  if (r >= 0.6)  return { label: 'Partial alignment',   color: 'var(--warn)',    cls: 'partial', dotCls: 'dot-partial' };
  return           { label: 'Needs attention',           color: 'var(--danger)',  cls: 'bad',     dotCls: 'dot-bad' };
}

function updateProgress() {
  const answered = answers.filter(a => a !== null).length;
  const pct = factors.length ? Math.round((answered / factors.length) * 100) : 0;
  document.getElementById('progress').style.width = pct + '%';
  document.getElementById('pct').textContent = pct + '%';
}

function render() {
  updateProgress();

  if (current >= factors.length) { showResults(); return; }

  document.getElementById('counter').textContent = `Question ${current + 1} of ${factors.length}`;
  const f = factors[current];
  const sel = answers[current];

  document.getElementById('quiz-area').innerHTML = `
    <div class="step active">
      <div class="factor-tag">Factor ${f.num} &mdash; ${f.name}</div>
      <p class="question">${f.question}</p>
      <p class="hint">${f.hint}</p>
      <div class="options">
        ${f.options.map((o, i) => `
          <button class="option${sel === i ? ' selected' : ''}" onclick="pick(${i})">
            <span class="option-radio"></span>
            <span>${o.text}</span>
          </button>
        `).join('')}
      </div>
      <div class="nav">
        <button class="btn" onclick="go(-1)" ${current === 0 ? 'disabled' : ''}>&larr; Back</button>
        <button class="btn primary" onclick="go(1)" ${sel === null ? 'disabled' : ''}>
          ${current === factors.length - 1 ? 'See results &rarr;' : 'Next &rarr;'}
        </button>
      </div>
    </div>
  `;
}

function pick(i) { answers[current] = i; render(); }

function go(dir) {
  if (dir === 1 && answers[current] === null) return;
  current = Math.max(0, Math.min(factors.length, current + dir));
  render();
}

function showResults() {
  document.getElementById('counter').textContent = 'Results';
  const maxScore = factors.length * 2;
  const total = answers.reduce((sum, a, i) => sum + (a !== null ? factors[i].options[a].score : 0), 0);
  const { label, color } = scoreInfo(total, maxScore);

  const desc = total >= maxScore * 0.83
    ? 'Your processes closely follow twelve-factor principles. Great foundation.'
    : total >= maxScore * 0.58
    ? 'Good foundation — a few areas still need attention.'
    : 'Several factors need work before reaching production readiness.';

  const cards = factors.map((f, i) => {
    const a = answers[i];
    const sc = a !== null ? f.options[a].score : 0;
    const { cls, dotCls } = scoreInfo(sc, 2);
    return `
      <div class="result-card ${cls}">
        <div class="rc-top">
          <div class="dot ${dotCls}"></div>
          <span class="rc-tag">${f.num}</span>
          <span class="rc-name">${f.name}</span>
        </div>
        <div class="rc-answer">${a !== null ? f.options[a].text : 'Not answered'}</div>
      </div>
    `;
  }).join('');

  document.getElementById('quiz-area').innerHTML = `
    <div class="step active">
      <div class="score-banner">
        <div class="score-big" style="color:${color}">${total}<span style="font-size:1.2rem;color:var(--muted)">/${maxScore}</span></div>
        <div>
          <div class="score-meta-label">Alignment score</div>
          <div class="score-verdict" style="color:${color}">${label}</div>
          <div class="score-desc">${desc}</div>
        </div>
      </div>
      <div class="results-grid">${cards}</div>
      <div class="nav">
        <button class="btn" onclick="restart()">Retake &circlearrowleft;</button>
      </div>
    </div>
  `;
}

function restart() {
  current = 0;
  answers = new Array(factors.length).fill(null);
  render();
}

// Theme
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let isDark = prefersDark;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
}

// Load questions from JSON
fetch('questions.json')
  .then(r => {
    if (!r.ok) throw new Error('Failed to load questions.json');
    return r.json();
  })
  .then(data => {
    factors = data;
    answers = new Array(factors.length).fill(null);
    render();
  })
  .catch(err => {
    document.getElementById('quiz-area').innerHTML = `
      <div class="error-msg">
        Could not load <code>questions.json</code>. Make sure all files are served from the same directory.<br><br>
        <small>${err.message}</small>
      </div>
    `;
    document.getElementById('counter').textContent = 'Error';
  });
