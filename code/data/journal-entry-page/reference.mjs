export default class ReferenceData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const embed = await this.parent.toEmbed({}, {});
    return embed.length ? embed : [embed];
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    return this.parent._embedTextPage(config, options);
  }
}
