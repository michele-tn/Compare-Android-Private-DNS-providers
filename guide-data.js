(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.GuidePrivacy = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    adguard: {
      operator: 'AdGuard Software Limited — Cyprus. Operator location is not a routing guarantee.',
      logging: 'Public service: no personal data processing declared; aggregate statistics and anonymous requested-domain data are retained.',
      retention: 'Anonymous requested-domain database covers the last 24 hours; aggregate metric retention is not specified in the cited policy.',
      controls: 'Public presets have no user logging controls. Private accounts have separate logging settings.',
      source: 'https://adguard-dns.io/en/privacy.html'
    },
    controld: {
      operator: 'Control D — Toronto, Canada; global service.',
      logging: 'Free resolvers: no individual browsing history, query logs or timestamps stored, according to the operator.',
      retention: 'No individual query-log retention declared for the free service.',
      controls: 'No personal dashboard or logging toggle on free presets.',
      source: 'https://controld.com/free-dns'
    },
    dns4eu: {
      operator: 'Whalebone, s.r.o. — Czech Republic. Public resolver infrastructure is declared to be inside the EU.',
      logging: 'Client IP is anonymized on the resolver before logging; queries are not sold or used for advertising profiles, according to the operator.',
      retention: 'Retention duration not established from the cited public overview; consult the linked Public Resolvers Policy there.',
      controls: 'Shared presets for individuals; no personal logging controls.',
      source: 'https://joindns4.eu/for-public'
    },
    dnsforge: {
      operator: 'dnsforge / adminForge — servers declared to be exclusively in Germany.',
      logging: 'DNS query logging is disabled, according to the operator.',
      retention: 'No DNS query logs retained under the declared no-logging configuration.',
      controls: 'Shared presets; report false positives to the operator rather than editing a personal allowlist.',
      source: 'https://dnsforge.de/'
    },
    quad9: {
      operator: 'Quad9 — Swiss privacy framework described in its policy; global resolver network.',
      logging: 'Under normal conditions, client IP addresses are held transiently in memory to answer queries; aggregate counters are kept. Anomalous/abusive traffic has a separate policy.',
      retention: 'Reply-to addresses are purged after query handling or session termination as described in the policy. Aggregate data is separate.',
      controls: 'No personal query-log dashboard on public profiles. Read the policy exceptions.',
      source: 'https://quad9.net/privacy/policy/'
    },
    cloudflare: {
      operator: 'Cloudflare operates the resolver in partnership with APNIC. Resolver-node location is not fixed by a hostname.',
      logging: 'Limited resolver logs and truncated IPs are processed. Policy exceptions include sampled network packets for troubleshooting and attack mitigation.',
      retention: 'Resolver logs and truncated IPs: up to 25 hours; limited sampled data and aggregates are exceptions. Aggregates may be retained indefinitely.',
      controls: 'Public presets have no personal logging toggle. APNIC has limited research access to anonymized data.',
      audit: 'The policy links an external audit report in its compliance resources. Scope and reporting period have not been assessed by this guide.',
      source: 'https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/'
    },
    cleanbrowsing: {
      operator: 'CleanBrowsing. Legal operator location is not established here from the cited free-resolver section.',
      logging: 'Free filters: no personally identifiable information tying queries to users is stored; anonymized aggregate query data is processed.',
      retention: 'Aggregate-data retention duration not specified in the cited free-filter section.',
      controls: 'Logging controls described for paid accounts do not apply to these free profiles.',
      source: 'https://cleanbrowsing.org/privacy'
    },
    google: {
      operator: 'Google Public DNS. The cited resolver policy covers a global service, not a fixed processing location.',
      logging: 'Temporary logs include client IP and query details. Permanent logs omit client IP and retain anonymized location information.',
      retention: 'Temporary logs: normally 24–48 hours; longer retention may apply to security/abuse investigations. Anonymized permanent logs are separate.',
      controls: 'No personal log toggle on the public resolver; DNS data is not used for ad targeting under the policy.',
      source: 'https://developers.google.com/speed/public-dns/privacy'
    },
    dnssb: {
      operator: 'xTom GmbH — Germany; resolver servers operate in multiple countries.',
      logging: 'No DNS queries, associated client IPs or query timestamps logged, according to the operator.',
      retention: 'No DNS query data retained under the declared policy. Website analytics have a separate scope.',
      controls: 'No account or per-user query-log controls for this public service.',
      source: 'https://dns.sb/privacy/'
    },
    mullvad: {
      operator: 'Mullvad public encrypted DNS — scheduled to close on 2 November 2026.',
      logging: 'Public-resolver-specific logging details are not established from the cited technical guide. Do not automatically apply VPN audit claims to this service.',
      retention: 'Not established for the public resolver in the cited technical guide.',
      controls: 'Shared profiles; not suggested for new setups because of the announced closure.',
      source: 'https://mullvad.net/en/help/dns-over-https-and-dns-over-tls'
    }
  };
});
