/**
 * Flavor switcher for the product site.
 * Config is injected as JSON in #inkstone-site-config at build time.
 */
(function () {
  const el = document.getElementById('inkstone-site-config');
  if (!el) return;

  /** @type {{
   *   storageKey: string,
   *   flavorIds: string[],
   *   appearance: Record<string, string>,
   *   defaultDark: string,
   *   defaultLight: string,
   *   softRedirectZh: string | null
   * }} */
  const config = JSON.parse(el.textContent || '{}');

  if (config.softRedirectZh) {
    try {
      const prefersZh = (navigator.languages || [navigator.language]).some((l) =>
        /^zh\b/i.test(l || ''),
      );
      if (prefersZh && !sessionStorage.getItem('inkstone.site.langPrompted')) {
        sessionStorage.setItem('inkstone.site.langPrompted', '1');
        location.replace(config.softRedirectZh);
      }
    } catch (_) {}
  }

  function systemFlavor() {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? config.defaultLight
      : config.defaultDark;
  }

  function resolveFlavor(id) {
    return config.flavorIds.includes(id) ? id : systemFlavor();
  }

  function readStored() {
    try {
      const value = localStorage.getItem(config.storageKey);
      return config.flavorIds.includes(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  /** Sync DOM (and optionally localStorage) to a flavor id. */
  function applyFlavor(id, persist) {
    const flavorId = resolveFlavor(id);
    const root = document.documentElement;
    root.dataset.flavor = flavorId;
    root.dataset.appearance = config.appearance[flavorId] || 'dark';
    root.style.colorScheme = root.dataset.appearance;

    document.querySelectorAll('.flavor-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.flavor === flavorId ? 'true' : 'false');
    });
    document.querySelectorAll('.flavor-panel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.flavor === flavorId);
    });

    if (persist) {
      try {
        localStorage.setItem(config.storageKey, flavorId);
      } catch (_) {}
    }
  }

  /**
   * User-driven switches wipe BL→TR via View Transitions; initial / system
   * sync stay instant (persist=false or reduced-motion / no API).
   */
  function setFlavor(id, persist) {
    const next = resolveFlavor(id);
    const run = () => applyFlavor(next, persist);
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skipWipe =
      !persist ||
      next === document.documentElement.dataset.flavor ||
      prefersReduce ||
      typeof document.startViewTransition !== 'function';

    if (skipWipe) {
      run();
      return;
    }
    document.startViewTransition(run);
  }

  applyFlavor(readStored() || systemFlavor(), false);

  document.querySelectorAll('.flavor-btn').forEach((btn) => {
    btn.addEventListener('click', () => setFlavor(btn.dataset.flavor, true));
  });

  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (!readStored()) applyFlavor(systemFlavor(), false);
    });
  } catch (_) {}
})();
