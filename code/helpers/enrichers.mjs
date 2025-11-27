export default class Enrichers {
  /**
   * The regex patterns.
   * @type {Record<string, RegExp>}
   */
  static PATTERNS = {
    status: /\[\[\/status (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
    check: /\[\[\/check (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
    reference: /\[\[reference (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
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
        const { type, subtype, formula } = element.dataset;
        const rollConfig = { type };
        if ((type === "journey") && (subtype in ryuutama.config.checkTypes.journey.subtypes)) {
          rollConfig.journeyId = subtype;
        }
        if (formula) rollConfig.formula = formula;

        const enricher = element.querySelector(".enricher");
        if (enricher._hasEvent) return;
        enricher._hasEvent = true;

        enricher.addEventListener("click", async (event) => {
          const target = event.currentTarget;
          const application = foundry.applications.instances.get(target.closest(".application")?.id);
          const tooltipActor = fromUuidSync(target.closest(".locked-tooltip [data-actor-uuid]")?.dataset.actorUuid);
          let actors = [];
          if (tooltipActor instanceof foundry.documents.Actor) actors = [tooltipActor];
          else if (application?.document instanceof foundry.documents.Actor) actors = [application.document];
          else if (application?.document?.actor instanceof foundry.documents.Actor) actors = [application.document.actor];
          else actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));

          for (const actor of actors) {
            await actor.system.rollCheck(rollConfig);
          }
        });

        element.querySelector(".request")?.addEventListener("click", event => {
          // TODO: request roll.
        });
      },
    });

    // Display a rules reference.
    enrichers.push({
      id: "reference",
      pattern: this.PATTERNS.reference,
      enricher: this.enrichReference,
      onRender: element => {},
    });
  }

  /* -------------------------------------------------- */

  /**
   * Parse parameters from a string.
   * @param {string} match
   * @returns {object}
   */
  static parseConfig(match) {
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
    config = Enrichers.parseConfig(config);

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
    config = Enrichers.parseConfig(config);

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

    if (!("formula" in config)) {
      const formula = config.values.find(k => !!k && foundry.dice.Roll.validate(k));
      if (formula) config.formula = formula;
    }

    // Show request.
    config.request ??= config.values.includes("request");

    const wrapper = new foundry.applications.elements.HTMLEnrichedContentElement();
    wrapper.classList.add(ryuutama.id);
    const elements = [];

    const anchor = document.createElement("A");
    elements.push(anchor);
    anchor.classList.add("enricher");
    if (!label && !!config.formula) label = `[${config.formula}]`;

    if (label) anchor.innerHTML = label.trim();
    else if (config.subtype) anchor.innerHTML = typeConfig.subtypes[config.subtype].label;
    else anchor.innerHTML = typeConfig.label;

    wrapper.dataset.type = config.type;
    if (config.subtype) wrapper.dataset.subtype = config.subtype;
    if (config.formula) wrapper.dataset.formula = config.formula;
    anchor.dataset.tooltipText = game.i18n.localize("RYUUTAMA.ROLL.TYPES." + config.type);

    if (config.request) {
      const request = document.createElement("A");
      request.innerHTML = "<i class=\"fa-solid fa-bullhorn\"></i>";
      request.classList.add("request");
      elements.push(request);
    }

    wrapper.innerHTML = elements.map(element => element.outerHTML).join("");

    return wrapper;
  }

  /* -------------------------------------------------- */

  /**
   * Enrich a reference enricher.
   * @param {RegExpMatchArray} match
   * @returns {Promise<HTMLAnchorElement|null>}
   */
  static async enrichReference(match) {
    let { config } = match.groups;
    config = Enrichers.parseConfig(config);

    if (!("id" in config)) {
      const id = config.values.find(k => k in ryuutama.config.references);
      if (!id) return null;
      config.id = id;
    }

    const uuid = ryuutama.config.references[config.id];
    const page = await fromUuid(uuid);
    if (!page || (page.type !== "reference")) return null;
    const anchor = document.createElement("A");
    anchor.classList.add(ryuutama.id, "enricher");
    anchor.innerHTML = page.name;
    anchor.dataset.referenceId = config.id;
    anchor.dataset.tooltipHtml = game.tooltip.constructor.constructHTML({ uuid });
    return anchor;
  }
}
