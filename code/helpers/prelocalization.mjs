export default class Prelocalization {
  /**
   * The records to localize.
   * @type {Array<Record<*, object>, object|undefined>}
   */
  static toLocalize = [];

  /* -------------------------------------------------- */

  /**
   * Assign a record to be prelocalized.
   * @param {Record<*, object>} record
   * @param {object} [options]
   * @returns {void}
   */
  static prelocalize(record, options) {
    this.toLocalize.push([record, options]);
  }

  /* -------------------------------------------------- */

  /**
   * Have sources been configured?
   * @type {boolean}
   */
  static #sourcesConfigured = false;

  /* -------------------------------------------------- */

  /**
   * Perform a one-time setup of sources from system and module flags.
   */
  static configureSources() {
    if (Prelocalization.#sourcesConfigured) return;
    Prelocalization.#sourcesConfigured = true;

    const config = ryuutama.config.sources;

    const configureSource = pkg => {
      const sources = pkg.flags?.[ryuutama.id]?.sources ?? {};
      for (const [k, v] of Object.entries(sources)) {
        config[k] = game.i18n.localize(v);
      }
    };

    // System
    configureSource(game.system);

    // Modules
    for (const module of game.modules) {
      if (!module.active) continue;
      configureSource(module);
    }

    Object.freeze(config);
  }
}
