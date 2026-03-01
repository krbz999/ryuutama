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
        type: new StringField({ blank: true, required: true }),
        chosen: new SchemaField({
          terrain: new StringField({ blank: true, required: true, choices: () => ryuutama.config.terrainTypes }),
          weather: new StringField({ blank: true, required: true, choices: () => ryuutama.config.weatherTypes }),
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

  /** @override */
  get isConfigured() {
    const { type, chosen } = this.choice;
    const { terrain, weather } = this.document.system.mastered;
    return ((type === "terrain") && (chosen.terrain in ryuutama.config.terrainTypes) && !terrain.has(chosen.terrain))
      || ((type === "weather") && (chosen.weather in ryuutama.config.weatherTypes) && !weather.has(chosen.weather));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.typeOptions = [
      { value: "terrain", label: _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionTerrain") },
      { value: "weather", label: _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.HABITAT.optionWeather") },
    ];

    context.showTerrains = this.choice.type === "terrain";
    context.showWeathers = this.choice.type === "weather";
  }
}
