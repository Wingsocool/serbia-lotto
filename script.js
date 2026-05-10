(() => {
  const HISTORY_KEY = 'lotteryHistory';
  const FAVORITES_KEY = 'favorites';
  const MAX_SELECTED = 7;
  const MAX_NUMBER = 39;

  let selectedNumbers = [];
  let currentScreen = 'home';
  let toastTimer = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const pad = (n) => String(n).padStart(2, '0');
  const formatNumbers = (numbers) => numbers.slice().sort((a, b) => a - b).map(pad).join(' - ');
  const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false });

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function buildNumberGrid() {
    const grid = $('#number-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= MAX_NUMBER; i += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'number-btn';
      button.dataset.number = i;
      button.textContent = pad(i);
      button.addEventListener('click', () => toggleNumber(i));
      grid.appendChild(button);
    }
  }

  function toggleNumber(number) {
    if (selectedNumbers.includes(number)) {
      selectedNumbers = selectedNumbers.filter((n) => n !== number);
    } else {
      if (selectedNumbers.length >= MAX_SELECTED) {
        showToast('最多只能选择 7 个号码');
        return;
      }
      selectedNumbers = [...selectedNumbers, number].sort((a, b) => a - b);
    }
    renderSelected();
  }

  function setSelected(numbers) {
    selectedNumbers = [...new Set(numbers)].filter((n) => n >= 1 && n <= MAX_NUMBER).slice(0, MAX_SELECTED).sort((a, b) => a - b);
    renderSelected();
    switchScreen('home');
  }

  function renderSelected() {
    const selectedBox = $('#selected-numbers');
    $('#selected-count').textContent = `${selectedNumbers.length}/${MAX_SELECTED}`;
    if (!selectedNumbers.length) {
      selectedBox.className = 'selected-numbers empty';
      selectedBox.textContent = '请选择 7 个号码';
    } else {
      selectedBox.className = 'selected-numbers';
      selectedBox.innerHTML = selectedNumbers.map((n) => `<span class="ball">${pad(n)}</span>`).join('');
    }

    $$('.number-btn').forEach((button) => {
      const number = Number(button.dataset.number);
      button.classList.toggle('selected', selectedNumbers.includes(number));
    });
  }

  function randomNumbers(pool = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1)) {
    const source = [...new Set(pool)].filter((n) => n >= 1 && n <= MAX_NUMBER);
    const result = [];
    while (result.length < MAX_SELECTED && source.length) {
      const index = Math.floor(Math.random() * source.length);
      result.push(source.splice(index, 1)[0]);
    }
    return result.sort((a, b) => a - b);
  }

  function saveToHistory() {
    if (selectedNumbers.length !== MAX_SELECTED) {
      showToast('请选择 7 个号码后再保存');
      return;
    }
    const history = readJson(HISTORY_KEY);
    const record = { id: Date.now(), date: nowText(), numbers: [...selectedNumbers] };
    writeJson(HISTORY_KEY, [record, ...history]);
    showToast('已保存到历史记录');
    renderHistory();
    renderStats();
  }

  function saveToFavorites() {
    if (selectedNumbers.length !== MAX_SELECTED) {
      showToast('请选择 7 个号码后再收藏');
      return;
    }
    const favorites = readJson(FAVORITES_KEY);
    const key = formatNumbers(selectedNumbers);
    const exists = favorites.some((item) => formatNumbers(item.numbers) === key);
    if (exists) {
      showToast('这组号码已经收藏过了');
      return;
    }
    writeJson(FAVORITES_KEY, [{ id: Date.now(), date: nowText(), numbers: [...selectedNumbers] }, ...favorites]);
    showToast('已加入收藏');
    renderFavorites();
  }

  async function shareText(text) {
    if (navigator.share) {
      try { await navigator.share({ text }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制，可粘贴分享');
    } catch {
      showToast(text);
    }
  }

  function shareSelected() {
    if (!selectedNumbers.length) {
      showToast('请先选择号码');
      return;
    }
    shareText(`我的塞尔维亚 Loto 选号：${formatNumbers(selectedNumbers)}`);
  }

  function groupByDate(records) {
    return records.reduce((groups, record) => {
      const date = String(record.date || '').split(' ')[0] || '未命名日期';
      groups[date] = groups[date] || [];
      groups[date].push(record);
      return groups;
    }, {});
  }

  function recordHtml(record, type) {
    return `
      <div class="record-item">
        <div class="record-main" data-use-${type}="${record.id}">
          <div class="record-time">${record.date}</div>
          <div class="record-numbers">${formatNumbers(record.numbers)}</div>
        </div>
        <div class="record-actions">
          <button class="small-btn slate" data-share-${type}="${record.id}">分享</button>
          <button class="small-btn danger" data-delete-${type}="${record.id}">删除</button>
        </div>
      </div>`;
  }

  function renderHistory() {
    const history = readJson(HISTORY_KEY);
    const list = $('#history-list');
    if (!history.length) {
      list.innerHTML = '<div class="empty-text">暂无历史记录</div>';
      return;
    }
    const grouped = groupByDate(history);
    list.innerHTML = Object.entries(grouped).map(([date, records]) => `
      <div class="date-header">${date}</div>
      ${records.map((record) => recordHtml(record, 'history')).join('')}
    `).join('');
  }

  function renderFavorites() {
    const favorites = readJson(FAVORITES_KEY);
    const list = $('#favorites-list');
    if (!favorites.length) {
      list.innerHTML = '<div class="empty-text">暂无收藏号码</div>';
      return;
    }
    list.innerHTML = favorites.map((record) => recordHtml(record, 'favorite')).join('');
  }

  function renderStats() {
    const history = readJson(HISTORY_KEY);
    const counts = Array(MAX_NUMBER).fill(0);
    history.forEach((record) => (record.numbers || []).forEach((n) => { if (counts[n - 1] !== undefined) counts[n - 1] += 1; }));
    const max = Math.max(1, ...counts);
    const stats = counts.map((count, index) => ({
      number: index + 1,
      count,
      percentage: history.length ? ((count / history.length) * 100).toFixed(1) : '0.0',
      intensity: count / max,
    })).sort((a, b) => b.count - a.count || a.number - b.number);

    $('#stats-subtitle').textContent = `共 ${history.length} 条记录`;
    $('#stats-grid').innerHTML = stats.map((stat) => {
      const alpha = 0.18 + stat.intensity * 0.82;
      return `
        <div class="stat-item" style="background: rgba(244, 67, 54, ${alpha})">
          <div>${pad(stat.number)}</div>
          <small>${stat.count}次 (${stat.percentage}%)</small>
        </div>`;
    }).join('');
  }

  function deleteRecord(key, id) {
    const records = readJson(key).filter((record) => record.id !== id);
    writeJson(key, records);
    renderHistory();
    renderFavorites();
    renderStats();
    showToast('已删除');
  }

  function switchScreen(screen) {
    currentScreen = screen;
    $$('.screen').forEach((panel) => panel.classList.remove('active'));
    $(`#screen-${screen}`).classList.add('active');
    $$('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.screen === screen));
    if (screen === 'history') renderHistory();
    if (screen === 'stats') renderStats();
    if (screen === 'favorites') renderFavorites();
  }

  function bindEvents() {
    $('#random-btn').addEventListener('click', () => setSelected(randomNumbers()));
    $('#clear-btn').addEventListener('click', () => { selectedNumbers = []; renderSelected(); });
    $('#save-btn').addEventListener('click', saveToHistory);
    $('#favorite-btn').addEventListener('click', saveToFavorites);
    $('#share-btn').addEventListener('click', shareSelected);

    $('#random-history-btn').addEventListener('click', () => {
      const history = readJson(HISTORY_KEY);
      const pool = history.flatMap((record) => record.numbers || []);
      const unique = [...new Set(pool)];
      if (unique.length < MAX_SELECTED) {
        showToast('历史号码不足以生成新组合');
        return;
      }
      setSelected(randomNumbers(unique));
    });

    $('#clear-history-btn').addEventListener('click', () => {
      if (!readJson(HISTORY_KEY).length) { showToast('暂无历史记录'); return; }
      if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        renderStats();
        showToast('已清空历史记录');
      }
    });

    $$('.nav-btn').forEach((button) => button.addEventListener('click', () => switchScreen(button.dataset.screen)));

    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-use-history], [data-share-history], [data-delete-history], [data-use-favorite], [data-share-favorite], [data-delete-favorite]');
      if (!target) return;

      const actionAttr = target.getAttributeNames().find((name) => name.startsWith('data-'));
      const id = Number(target.getAttribute(actionAttr));
      const isFavorite = actionAttr.includes('favorite');
      const key = isFavorite ? FAVORITES_KEY : HISTORY_KEY;
      const records = readJson(key);
      const record = records.find((item) => item.id === id);
      if (!record) return;

      if (actionAttr.includes('use')) setSelected(record.numbers);
      if (actionAttr.includes('share')) shareText(`${isFavorite ? '我收藏的' : '塞尔维亚'} Loto 号码：${formatNumbers(record.numbers)}`);
      if (actionAttr.includes('delete') && confirm('确定要删除这条记录吗？')) deleteRecord(key, id);
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }

  buildNumberGrid();
  bindEvents();
  renderSelected();
  renderHistory();
  renderStats();
  renderFavorites();
})();
