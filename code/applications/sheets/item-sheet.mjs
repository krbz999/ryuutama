import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

export default class RyuutamaItemSheet extends RyuutamaDocumentSheet {
  /** @override */
  static PARTS = {
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
      templates: [
        "systems/ryuutama/templates/sheets/item-sheet/weapon.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/gear.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/defense.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/herb.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/container.hbs",
        "systems/ryuutama/templates/sheets/item-sheet/spell.hbs",
      ],
      classes: ["scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const hasModifiers = this.document.system.schema.has("modifiers");
    const modifierOptions = {};

    if (hasModifiers) {
      for (const [k, v] of Object.entries(ryuutama.config.itemModifiers)) {
        if (v.hidden && context.isEditable && !this.document.system._source.modifiers.includes(k)) continue;
        if (v.hidden && !context.isEditable && !this.document.system.modifiers.has(k)) continue;
        modifierOptions[k] = { value: k, label: v.label };
      }
      for (const k of this.document.system._source.modifiers) {
        if (!(k in modifierOptions)) modifierOptions[k] = { value: k, label: k };
      }
    }

    Object.assign(context, {
      isContainer: this.document._source.type === "container",
      isHerb: this.document._source.type === "herb",
      isSpell: this.document._source.type === "spell",
      isWeapon: this.document._source.type === "weapon",
      hasDurability: this.document.system.schema.has("durability"),
      hasPrice: this.document.system.schema.has("price"),
      hasModifiers,
      isGear: this.document.system.schema.has("gear"),
      hasArmor: this.document.system.schema.has("armor"),
      modifierOptions: Object.values(modifierOptions),
      enriched: {
        description: await CONFIG.ux.TextEditor.enrichHTML(
          this.document.system.description.value,
          { rollData: this.document.getRollData(), relativeTo: this.document },
        ),
      },
    });

    if (context.isHerb) {
      context.enriched.effect = await CONFIG.ux.TextEditor.enrichHTML(
        this.document.system.description.effect,
        { rollData: this.document.getRollData(), relativeTo: this.document },
      );
    }

    if (context.isSpell) {
      context.spell = {};
      const duration = context.spell.duration = {};
      duration.type = context.disabled
        ? context.document.system.spell.duration.type
        : context.source.system.spell.duration.type;
      duration.units = !!ryuutama.config.spellDurationTypes[context.spell.duration.type]?.units;
      duration.special = duration.type === "special";
    }

    return context;
  }
}
