export default class Enrichers {
  /**
   * The regex patterns.
   * @type {Record<string, RegExp>}
   */
  static PATTERNS = {
    status: /\[\[\/status (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
    check: /\[\[\/check (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
  };

  /* -------------------------------------------------- */

  /**
   * Register the enrichers.
   */
  static registerEnrichers() {
    const enrichers = CONFIG.TextEditor.enrichers;

    // Apply a status effect to selected tokens' actors.
    enrichers.push({
      id: "status",
      pattern: this.PATTERNS.status,
      enricher: this.enrichStatus,
      onRender: element => {
        element = element.querySelector("[data-status-id]");
        const { statusId, strength } = element.dataset;
        element.addEventListener("click", () => ryuutama.utils.applyStatus(statusId, Number(strength)));
      },
    });

    // Roll a check.
    enrichers.push({
      id: "check",
      pattern: this.PATTERNS.check,
      enricher: this.enrichCheck,
      onRender: element => {
        element = element.querySelector("[data-type]");
        const { type, subtype } = element.dataset;
        const rollConfig = { type };
        if ((type === "journey") && (subtype in ryuutama.config.checkTypes.journey.subtypes)) {
          rollConfig.journeyId = subtype;
        }

        element.addEventListener("click", async (event) => {
          const actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));
          for (const actor of actors) {
            await actor.system.rollCheck(rollConfig);
          }
        });
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
   * @returns {HTMLAnchorElement|null}
   */
  static enrichStatus(match) {
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

    const anchor = document.createElement("A");
    anchor.classList.add(ryuutama.id, "enricher");
    anchor.innerHTML = label ? label.trim() : `[${ryuutama.config.statusEffects[config.id].name}: ${config.strength}]`;
    anchor.dataset.statusId = config.id;
    anchor.dataset.strength = config.strength;
    return anchor;
  }

  /* -------------------------------------------------- */

  /**
   * Enrich a check enricher.
   * @param {RegExpMatchArray} match
   * @returns {HTMLAnchorElement|null}
   */
  static enrichCheck(match) {
    let { config, label } = match.groups;
    config = Enrichers.parseconfig(config);

    if (!("type" in config)) {
      const type = config.values.find(k => k in ryuutama.config.checkTypes);
      if (!type) return null;
      config.type = type;
    }

    const typeConfig = ryuutama.config.checkTypes[config.type];

    if (typeConfig.subtypes && !("subtype" in config)) {
      const subtype = config.values.find(k => k in typeConfig.subtypes);
      if (subtype) config.subtype = subtype;
    }

    const anchor = document.createElement("A");
    anchor.classList.add(ryuutama.id, "enricher");

    if (label) anchor.innerHTML = label.trim();
    else if (config.subtype) anchor.innerHTML = typeConfig.subtypes[config.subtype].label;
    else anchor.innerHTML = typeConfig.label;

    anchor.dataset.type = config.type;
    if (config.subtype) anchor.dataset.subtype = config.subtype;

    return anchor;
  }
}
