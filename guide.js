(function () {
  'use strict';
  const core = GuideCore;
  const privacy = GuidePrivacy;
  const byId = id => document.getElementById(id);
  const knownHosts = new Map(entries.map(entry => [entry.host, entry]));
  const storageKey = 'android-private-dns-guide-v1';
  let finderRequested = false;
  let storageAvailable = true;
  const hiddenColumns = new Set();

  function setTheme(light) {
    document.documentElement.classList.toggle('light', light);
    byId('theme').setAttribute('aria-pressed', String(light));
    byId('theme').textContent = light ? 'Dark theme' : 'Light theme';
  }

  function storageMessage() {
    byId('storage-status').textContent = storageAvailable ?
      'Only favorites and theme are saved locally. Comparison links are created on request.' :
      'Browser storage is unavailable. Favorites and theme work in this tab but cannot be saved.';
  }

  function savePreferences() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({favorites: [...state.favorites], light: document.documentElement.classList.contains('light')}));
    } catch {
      storageAvailable = false;
    }
    storageMessage();
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    state.favorites = new Set(core.cleanHosts(saved?.favorites, entries));
    if (typeof saved?.light === 'boolean') setTheme(saved.light);
    else setTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
  } catch {
    storageAvailable = false;
  }
  storageMessage();

  const shared = core.readShare(window.location.search, entries, providers);
  state.selected = new Set(shared.selected);
  search.value = shared.query;
  providerSelect.value = shared.provider;
  sortSelect.value = shared.sort;
  state.filter = shared.filter;
  byId('differences').checked = shared.differences;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  function privacyMarkup(key) {
    const data = privacy[key];
    const facts = [['Operator / location', data.operator], ['Query logging — operator declaration', data.logging],
      ['Retention — operator declaration', data.retention], ['User controls', data.controls],
      ['Audit evidence', data.audit || 'Not assessed by this guide. This is not a claim that no audit exists.'],
      ['Source review', catalog.reviewed + ' · Operator publication'], ['Live DoT check', 'Not performed in this edition']];
    return '<details class="panel privacy-card" id="privacy-' + key + '"><summary>' + escapeHtml(providers[key].name) +
      '</summary><dl class="facts">' + facts.map(([label, value]) => '<dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd>').join('') +
      '</dl><div class="source-links">' + externalLink(data.source, 'Privacy evidence', providers[key].name + ' privacy evidence') +
      externalLink(providers[key].portal, 'Provider portal') + '</div></details>';
  }
  byId('privacy-cards').innerHTML = Object.keys(providers).map(privacyMarkup).join('');

  function renderShortlist() {
    const selected = [...state.selected].map(host => knownHosts.get(host));
    const onlyDifferences = byId('differences').checked;
    byId('shortlist-count').textContent = selected.length + ' / 4 selected';
    byId('clear-comparison').disabled = !selected.length;
    byId('shortlist-table').hidden = !selected.length;
    byId('shortlist-empty').hidden = Boolean(selected.length);
    byId('selected-profiles').innerHTML = selected.map(entry => '<button class="ghost" data-compare="' + escapeHtml(entry.host) +
      '" aria-label="Remove ' + escapeHtml(entry.host) + ' from comparison">' + escapeHtml(providers[entry.provider].name + ' · ' + entry.name) + ' ×</button>').join('');
    byId('shortlist-head').innerHTML = selected.length ? '<tr><th scope="col">Feature</th>' + selected.map(entry =>
      '<th scope="col">' + escapeHtml(providers[entry.provider].name) + '<small>' + escapeHtml(entry.name) + '</small><code>' +
      escapeHtml(entry.host) + '</code>' + copyButton(entry) + '<small class="status">' + escapeHtml(lifecycle(entry)) + '</small></th>').join('') + '</tr>' : '';
    const allRows = core.comparisonRows(selected, providers, privacy, catalog.reviewed);
    const rows = onlyDifferences && selected.length > 1 ? core.differentRows(allRows) : allRows;
    byId('shortlist-body').innerHTML = selected.length ? rows.map(row => '<tr><th scope="row">' + escapeHtml(row.label) + '</th>' +
      row.values.map(value => '<td>' + escapeHtml(value) + '</td>').join('') + '</tr>').join('') + '<tr><th scope="row">Primary sources</th>' +
      selected.map(entry => '<td>' + sourceLinks(entry) + externalLink(privacy[entry.provider].source, 'Privacy evidence') + '</td>').join('') + '</tr>' : '';
    byId('shortlist-hint').textContent = selected.length === 1 ? 'Add another profile to compare differences. One profile is shown for reference.' :
      selected.length > 1 ? (onlyDifferences ? (allRows.length - rows.length) + ' identical feature rows hidden. Hostnames, lifecycle and source links remain visible.' :
        '“Not advertised” is not proof that a domain will be allowed. Privacy entries are operator declarations.') : '';
  }

  function renderFinder() {
    const purpose = byId('finder-purpose').value;
    byId('finder-ads-label').hidden = purpose !== 'family';
    if (!finderRequested) return;
    if (byId('finder-rules').value === 'personal') {
      byId('finder-status').textContent = 'Your own exceptions require a personal profile, not a shared public hostname.';
      byId('finder-results').innerHTML = '<article class="panel"><h3>Use a configurable profile</h3><p>Compare NextDNS, AdGuard Private DNS and Control D Personal below. Enable the categories you want in the dashboard and copy your actual device/profile hostname. Plan limits and log controls differ.</p><a class="primary-link" href="#personal">Explore all 3 personal options →</a></article>';
      return;
    }
    const result = core.findMatches(entries, providers, purpose, byId('finder-ads').checked);
    const reasons = {ads: 'Advertises both ad and tracker filtering.', family: byId('finder-ads').checked ? 'Advertises adult-content and ad filtering.' : 'Advertises adult-content filtering.', threat: 'Advertises malicious-domain filtering.', unfiltered: 'Listed as an unfiltered profile; legal or abuse-related restrictions may still apply.'};
    byId('finder-status').textContent = result.total + ' matching public profiles. Showing ' + result.matches.length + ' examples from different operators; not a performance ranking.';
    byId('finder-results').innerHTML = result.matches.map(entry => '<article class="card finder-card"><span class="provider">' +
      escapeHtml(providers[entry.provider].name) + '</span><h3>' + escapeHtml(entry.name) + '</h3><p class="small good">Why it matches: ' +
      escapeHtml(reasons[purpose]) + '</p><p class="note">' + escapeHtml(entry.notes) + '</p><p class="small subtle">Shared preset: no personal exceptions. Verify your apps after switching.</p><div class="host"><code>' +
      escapeHtml(entry.host) + '</code>' + copyButton(entry) + '</div>' + profileActions(entry) + '<div class="card-links">' + sourceLinks(entry) + '</div></article>').join('');
  }
  byId('finder-form').addEventListener('submit', event => { event.preventDefault(); finderRequested = true; renderFinder(); });
  byId('finder-form').addEventListener('change', renderFinder);

  function applyColumnVisibility() {
    document.querySelectorAll('.compare tr').forEach(row => {
      if (row.children.length !== 15) return;
      [...row.children].forEach((cell, index) => { cell.hidden = hiddenColumns.has(index); });
    });
  }
  const headings = [...document.querySelectorAll('.compare thead th')];
  byId('column-options').innerHTML = headings.slice(2).map((heading, index) => '<label><input type="checkbox" data-column="' + (index + 2) + '" checked> ' + escapeHtml(heading.textContent) + '</label>').join('');
  byId('column-options').addEventListener('change', event => {
    const input = event.target.closest('[data-column]');
    if (!input) return;
    const index = Number(input.dataset.column);
    if (input.checked) hiddenColumns.delete(index); else hiddenColumns.add(index);
    applyColumnVisibility();
  });
  byId('all-columns').addEventListener('click', () => {
    hiddenColumns.clear();
    document.querySelectorAll('[data-column]').forEach(input => { input.checked = true; });
    applyColumnVisibility();
  });
  document.addEventListener('guide:render', () => {
    applyColumnVisibility();
    byId('favorite-count').textContent = '(' + state.favorites.size + ')';
  });

  function updateActions() {
    render();
    renderFinder();
    renderShortlist();
  }
  document.addEventListener('click', event => {
    const compare = event.target.closest('button[data-compare]');
    const favorite = event.target.closest('button[data-favorite]');
    const copy = event.target.closest('button[data-host]');
    if (copy && !copy.closest('#cards, #comparison-body')) copyHost(copy);
    const button = compare || favorite;
    if (!button) return;
    const host = compare ? compare.dataset.compare : favorite.dataset.favorite;
    if (!knownHosts.has(host)) return;
    const originalContainer = button.closest('#cards, #finder-results, #selected-profiles, #comparison-body');
    const set = compare ? state.selected : state.favorites;
    if (set.has(host)) set.delete(host);
    else if (compare && set.size >= 4) { showToast('Compare up to four profiles. Remove one before adding another.', true); return; }
    else set.add(host);
    if (favorite) savePreferences();
    updateActions();
    const attribute = compare ? 'data-compare' : 'data-favorite';
    const replacement = originalContainer?.querySelector('button[' + attribute + '="' + host + '"]');
    (replacement || originalContainer?.querySelector('button') || byId('share-comparison')).focus({preventScroll: true});
  });
  byId('clear-comparison').addEventListener('click', () => { state.selected.clear(); updateActions(); byId('share-comparison').focus({preventScroll: true}); });
  byId('differences').addEventListener('change', renderShortlist);
  byId('favorites-only').addEventListener('change', event => { state.favoritesOnly = event.target.checked; applyFilterChange(); });
  byId('reset').addEventListener('click', () => { state.favoritesOnly = false; byId('favorites-only').checked = false; applyFilterChange(); });
  byId('theme').addEventListener('click', savePreferences);

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch { /* Try manual browser clipboard support below. */ }
    const focused = document.activeElement;
    const input = document.createElement('textarea');
    input.value = text;
    input.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(input);
    let copied = false;
    try { input.select(); copied = document.execCommand('copy'); } catch { copied = false; }
    finally { input.remove(); focused?.focus({preventScroll: true}); }
    return copied;
  }
  byId('share-comparison').addEventListener('click', async () => {
    const url = core.shareUrl(window.location.href, {selected: [...state.selected], query: search.value.trim(), provider: providerSelect.value,
      filter: state.filter, sort: sortSelect.value, differences: byId('differences').checked});
    const copied = await copyText(url);
    if (!copied) {
      byId('shortlist-hint').textContent = 'Clipboard unavailable. Select and copy this link: ' + url;
      showToast('Select the share link below the controls and copy it manually.', true);
      return;
    }
    const local = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
    showToast(local ? 'Local preview link copied; it works only on this computer.' : 'Comparison link copied. Favorites stay private to this browser.');
  });

  byId('hostname-form').addEventListener('submit', event => {
    event.preventDefault();
    const verdict = core.validateHostname(byId('hostname-check').value, entries, providers, new Date().toISOString().slice(0, 10));
    const output = byId('hostname-feedback');
    output.textContent = verdict.message;
    output.className = verdict.valid && !verdict.warning ? 'good' : 'status';
    byId('hostname-check').setAttribute('aria-invalid', String(!verdict.valid));
  });

  function renderTestProgress() {
    const count = document.querySelectorAll('[data-test-step]:checked').length;
    byId('test-progress').textContent = count + ' of 4 steps marked as reviewed.' + (count === 4 ? ' Checklist complete — these are your observations, not an automatic security certification.' : '');
  }
  byId('test-plan').addEventListener('change', renderTestProgress);
  byId('reset-tests').addEventListener('click', () => { document.querySelectorAll('[data-test-step]').forEach(input => { input.checked = false; }); renderTestProgress(); });
  byId('clear-local').addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); storageAvailable = true; } catch { storageAvailable = false; }
    state.favorites.clear(); state.favoritesOnly = false; byId('favorites-only').checked = false;
    setTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
    updateActions(); storageMessage();
    showToast(storageAvailable ? 'Saved favorites and theme cleared. Comparison is unchanged.' : 'Session preferences cleared; browser storage could not be accessed.', !storageAvailable);
  });
  render();
  renderShortlist();
  renderFinder();
})();
