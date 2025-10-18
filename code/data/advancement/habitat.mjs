import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure terrain and weather condition specialties.
 */
export default class HabitatAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        type: new StringField({ blank: false, required: true }),
        chosen: new SchemaField({
          terrain: new StringField({ blank: false, required: true, choices: () => ryuutama.config.terrainTypes }),
          weather: new StringField({ blank: false, required: true, choices: () => ryuutama.config.weatherTypes }),
        }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "habitat";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/habitat.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.typeOptions = [
      { value: "terrain", label: game.i18n.localize("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionTerrain") },
      { value: "weather", label: game.i18n.localize("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionWeather") },
    ];
  }

  /* -------------------------------------------------- */

  /** @override */
  static _attachPartListeners(partId, htmlElement, options) {
    htmlElement.querySelector("[name='choice.type']").addEventListener("change", event => {
      const terrain = htmlElement.querySelector("[name='choice.chosen.terrain']");
      const weather = htmlElement.querySelector("[name='choice.chosen.weather']");

      const type = event.currentTarget.value;
      terrain.closest(".form-group").classList.toggle("hidden", type !== "terrain");
      weather.closest(".form-group").classList.toggle("hidden", type !== "weather");
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineResult(actor, formData) {
    const data = foundry.utils.expandObject(formData.object);
    return { result: new this({ type: this.TYPE, ...data }, { parent: actor }), type: "advancement" };
  }
}
