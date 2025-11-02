import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure chosen types.
 */
export default class TypeAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: true, required: true, choices: () => ryuutama.config.travelerTypes }),
        attack: new StringField({ blank: true, required: true, choices: () => {
          return {
            ...ryuutama.config.weaponTypes,
            unarmed: ryuutama.config.weaponUnarmedTypes.unarmed,
          };
        } }),
        magic: new StringField({ blank: true, required: true, choices: () => ryuutama.config.seasons }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "type";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/type.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.TYPE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static _determineValidity(formData) {
    formData = foundry.utils.expandObject(formData.object);
    switch (formData.choice.chosen) {
      case "magic": return !!formData.choice.magic;
      case "attack": return !!formData.choice.attack;
      default: return !!formData.choice.chosen;
    }
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineResult(actor, formData) {
    const data = foundry.utils.expandObject(formData.object);
    return { result: new this({ type: this.TYPE, ...data }, { parent: actor }), type: "advancement" };
  }

  /* -------------------------------------------------- */

  /** @override */
  static _attachPartListeners(partId, htmlElement, options) {
    const type = htmlElement.querySelector("[name='choice.chosen']");
    type.addEventListener("change", event => {
      const type = event.currentTarget.value;
      htmlElement.querySelectorAll("[name='choice.attack'], [name='choice.magic']").forEach(input => {
        input.closest(".form-group").classList.toggle("hidden", type !== input.name.split(".").at(-1));
      });
    });
  }
}
