const { HTMLField } = foundry.data.fields;

export default class ReferenceData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      tooltip: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PAGE.REFERENCE",
  ];

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const text = this.tooltip || this.parent.text.content;

    const enriched = await CONFIG.ux.TextEditor.enrichHTML(text, {
      rollData: this.parent.getRollData?.(), relativeTo: this.parent,
    });
    const context = { page: this.parent, enriched };
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/pages/tooltip.hbs",
      context,
    );

    const div = document.createElement("DIV");
    div.innerHTML = htmlString;
    return div.children;
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    config.long = (config.long === true) || (config.values.includes("long"));
    const text = config.long || !this.tooltip ? this.parent.text.content : this.tooltip;

    options = { ...options, relativeTo: this.parent };
    const {
      secrets = options.secrets ?? this.parent.isOwner,
      documents = options.documents,
      links = options.links,
      rolls = options.rolls,
      embeds = options.embeds,
    } = config;
    foundry.utils.mergeObject(options, { secrets, documents, links, rolls, embeds });
    const enrichedPage = await CONFIG.ux.TextEditor.enrichHTML(text, options);
    const container = document.createElement("DIV");
    container.innerHTML = enrichedPage;
    return container.children;
  }
}
