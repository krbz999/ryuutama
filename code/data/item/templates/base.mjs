const { HTMLField, SchemaField } = foundry.data.fields;

/**
 * Base class that all other item data models inherit from.
 */
export default class BaseData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField(this.HTMLFields),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Define the HTML fields within `description`.
   * @type {object}
   */
  static get HTMLFields() {
    return {
      value: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.description.value, {
      rollData: this.parent.getRollData(), relativeTo: this.parent,
    });
    const context = {
      item: this.parent,
      enriched,
    };
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/items/tooltip.hbs",
      context,
    );

    const div = document.createElement("DIV");
    div.innerHTML = htmlString;
    return div.children;
  }
}
