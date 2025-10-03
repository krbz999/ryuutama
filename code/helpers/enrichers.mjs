export default class Enrichers {
  /**
   * The regex patterns.
   * @type {Record<string, RegExp>}
   */
  static PATTERNS = {
    status: /\[\[\/status (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
  };

  /* -------------------------------------------------- */

  /**
   * Register the enrichers.
   */
  static registerEnrichers() {
    const enrichers = CONFIG.TextEditor.enrichers;
    enrichers.push({
      id: "status",
      pattern: this.PATTERNS.status,
      enricher: this.enrichStatus,
      onRender: element => {
        element = element.querySelector("[data-status-id]");
        const { statusId, strength } = element.dataset;
        element.addEventListener("click", () => ryuutama.utils.applyStatus(statusId, strength));
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Parse parameters from a string.
   * @param {string} match
   * @returns {object}
   */
  static parseconfig(match) {
    const config = { _config: match, values: [] };
    for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
      if (!part) continue;
      const [key, value] = part.split("=");
      const valueLower = value?.toLowerCase();
      if (value === undefined) config.values.push(key.replace(/(^"|"$)/g, ""));
      else if (["true", "false"].includes(valueLower)) config[key] = valueLower === "true";
      else if (Number.isNumeric(value)) config[key] = Number(value);
      else config[key] = value.replace(/(^"|"$)/g, "");
    }
    return config;
  }

  /* -------------------------------------------------- */
  /*   Enrichment methods.                              */
  /* -------------------------------------------------- */

  /**
   * Enrich a status enricher.
   * @param {RegExpMatchArray} match
   * @param {EnrichmentOptions} options
   * @returns {HTMLAnchorElement|null}
   */
  static enrichStatus(match, options) {
    let { config, label } = match.groups;
    config = Enrichers.parseconfig(config);

    if (!("id" in config)) {
      const id = config.values.find(k => k in ryuutama.config.statusEffects);
      if (!id) return null;
      config.id = id;
    }

    if (!("strength" in config)) {
      const strength = config.values.find(k => Number.isNumeric(k));
      if (!strength) return null;
      config.strength = strength;
    }
    config.strength = Number(config.strength);

    const anchor = document.createElement("A");
    anchor.classList.add(ryuutama.id, "enricher");
    anchor.innerHTML = label ? label.trim() : `[${ryuutama.config.statusEffects[config.id].name}: ${config.strength}]`;
    anchor.dataset.statusId = config.id;
    anchor.dataset.strength = config.strength;
    return anchor;
  }
}
