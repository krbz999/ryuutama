import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

export default class RyuutamaItemSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      configureHabitat: RyuutamaItemSheet.#configureHabitat,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
      templates: [
        "systems/ryuutama/templates/sheets/item-sheet/weapon.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/gear.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/defense.hbs",
      ],
      classes: ["scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const modifierOptions = {};
    for (const [k, v] of Object.entries(ryuutama.config.itemModifiers)) {
      if (v.hidden && context.isEditable && !this.document.system._source.modifiers.includes(k)) continue;
      if (v.hidden && !context.isEditable && !this.document.system.modifiers.has(k)) continue;
      modifierOptions[k] = { value: k, label: v.label };
    }
    for (const k of this.document.system._source.modifiers) {
      if (!(k in modifierOptions)) modifierOptions[k] = { value: k, label: k };
    }

    return Object.assign(context, {
      hasDurability: this.document.system.schema.has("durability"),
      isGear: this.document.system.schema.has("gear"),
      isWeapon: this.document._source.type === "weapon",
      hasArmor: this.document.system.schema.has("armor"),
      modifierOptions: Object.values(modifierOptions),
      enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.document.system.description.value,
        { rollData: this.document.getRollData(), relativeTo: this.document },
      ),
    });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaItemSheet
   */
  static #configureHabitat(event, target) {
    const application = new ryuutama.applications.apps.HabitatConfig({ document: this.document });
    application.render({ force: true });
  }
}
