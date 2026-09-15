(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GuideCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const categories = ['Ads', 'Trackers', 'Threats', 'Adult', 'Gambling', 'Social', 'SafeSearch'];
  const filters = ['all', 'ads', 'threat', 'adult', 'social', 'unfiltered', 'retiring'];

  function cleanHosts(values, entries, limit = Infinity) {
    if (!Array.isArray(values)) return [];
    const known = new Set(entries.map(entry => entry.host));
    return [...new Set(values.filter(value => typeof value === 'string' && known.has(value)))].slice(0, limit);
  }

  function findMatches(entries, providers, purpose, requireAds = false) {
    const required = {ads: [0, 1], family: requireAds ? [0, 3] : [3], threat: [2], unfiltered: []}[purpose];
    if (!required) return {matches: [], total: 0};
    const matches = entries.filter(entry => !providers[entry.provider].retires &&
      (purpose === 'unfiltered' ? entry.mode === 'Unfiltered' : required.every(index => entry.coverage[index] === '1')));
    const extras = entry => [...entry.coverage].filter((flag, index) => flag === '1' && !required.includes(index)).length;
    matches.sort((a, b) => extras(a) - extras(b) ||
      providers[a.provider].name.localeCompare(providers[b.provider].name) || a.name.localeCompare(b.name));
    const seen = new Set();
    return {total: matches.length, matches: matches.filter(entry => {
      if (seen.has(entry.provider)) return false;
      seen.add(entry.provider);
      return true;
    }).slice(0, 3)};
  }

  function comparisonRows(selected, providers, privacy, reviewed) {
    const rows = categories.map((label, index) => ({label, values: selected.map(entry =>
      entry.coverage[index] === '1' ? 'Yes — advertised' : 'Not advertised')}));
    for (const [label, get] of [
      ['Purpose', entry => entry.mode],
      ['Access', entry => providers[entry.provider].access],
      ['Personal rules', () => 'Not available in these public presets'],
      ['Service limits / policy', entry => providers[entry.provider].policy],
      ['Profile notes', entry => entry.notes],
      ['Operator / location context', entry => privacy[entry.provider].operator],
      ['Query logging (declared)', entry => privacy[entry.provider].logging],
      ['Retention (declared)', entry => privacy[entry.provider].retention],
      ['Audit evidence', entry => privacy[entry.provider].audit || 'Not assessed by this guide'],
      ['Documentation reviewed', () => reviewed],
      ['Live DoT check', () => 'Not performed in this edition']]
    ) rows.push({label, values: selected.map(get)});
    return rows;
  }

  function differentRows(rows) {
    return rows.filter(row => new Set(row.values).size > 1);
  }

  function readShare(query, entries, providers) {
    const params = new URLSearchParams(query);
    return {
      selected: cleanHosts((params.get('compare') || '').split(','), entries, 4),
      query: (params.get('q') || '').slice(0, 120),
      provider: Object.hasOwn(providers, params.get('provider')) ? params.get('provider') : 'all',
      filter: filters.includes(params.get('filter')) ? params.get('filter') : 'all',
      sort: ['guide', 'provider', 'host'].includes(params.get('sort')) ? params.get('sort') : 'guide',
      differences: params.get('diff') === '1'
    };
  }

  function shareUrl(base, options) {
    const url = new URL(base);
    url.search = '';
    if (options.selected.length) url.searchParams.set('compare', options.selected.join(','));
    if (options.query) url.searchParams.set('q', options.query.slice(0, 120));
    if (options.provider !== 'all') url.searchParams.set('provider', options.provider);
    if (options.filter !== 'all') url.searchParams.set('filter', options.filter);
    if (options.sort !== 'guide') url.searchParams.set('sort', options.sort);
    if (options.differences) url.searchParams.set('diff', '1');
    url.hash = 'shortlist';
    return url.href;
  }

  function validateHostname(value, entries, providers, today) {
    const host = value.trim().toLowerCase();
    if (!host) return {valid: false, message: 'Enter one provider hostname.'};
    if (/[<>]/.test(host)) return {valid: false, message: 'Replace the example ID with your actual hostname from the provider dashboard.'};
    if (/[\s/:?#]/.test(host)) return {valid: false, message: 'Use one bare hostname. Remove schemes, spaces, ports, paths and query strings.'};
    if (/^\d+(\.\d+){3}$/.test(host)) return {valid: false, message: 'This is an IP address. Android Private DNS requires the provider hostname.'};
    const labels = host.split('.');
    if (host.length > 253 || labels.length < 2 || labels.some(label => label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
      return {valid: false, message: 'Invalid hostname format. Use the exact ASCII hostname published by your provider.'};
    }
    const entry = entries.find(item => item.host === host);
    if (!entry) return {valid: true, message: 'Valid hostname format, but not in this public catalog. This does not confirm DoT support or availability.'};
    const retires = providers[entry.provider].retires;
    if (retires) return {valid: true, warning: true, message: (today >= retires ? 'Closure date reached: ' : 'Service scheduled to close: ') + retires + '. Choose another provider for a new setup.'};
    return {valid: true, message: 'Valid format and listed in this catalog: ' + host + '. Next, verify the connection on your Android phone.'};
  }

  return {categories, cleanHosts, findMatches, comparisonRows, differentRows, readShare, shareUrl, validateHostname};
});
