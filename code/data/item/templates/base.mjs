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
    div.querySelector("rich-tooltip").document = this.parent;
    this._attachTooltipListeners(div);
    return div.children;
  }

  /* -------------------------------------------------- */

  /**
   * Attach listeners to the enriched tooltip. Listeners must be attached to
   * a child of the `element`, as the parent `div` is never used.
   * @param {HTMLDivElement} element
   */
  _attachTooltipListeners(element) {
    const button = element.querySelector("[data-action=updateDur]");
    button?.addEventListener("click", event => {
      const delta = event.shiftKey ? -1 : 1;
      const item = event.currentTarget.closest("rich-tooltip").document;
      item.update({ "system.durability.spent": item.system.durability.spent + delta });
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    ryuutama.applications.elements.RichTooltip.tooltips.get(this.parent.uuid).refresh();
  }
}
