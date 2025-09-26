import DocumentConfig from "../api/document-config.mjs";

export default class WeatherConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/weather-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("RYUUTAMA.WEATHER.CONFIG.title")}: ${this.document.name}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const weathers = new Set(this.document.system._source.gear.habitat.weather);

    context.groups = [];
    for (const groupKey in ryuutama.config.weatherCategories) {
      const group = {
        label: ryuutama.config.weatherCategories[groupKey].label,
        head: {
          checked: weathers.has(`ALL:${groupKey}`),
          disabled: weathers.has("ALL"),
          value: groupKey,
          label: game.i18n.format("RYUUTAMA.WEATHER.CATEGORY.allType", {
            type: ryuutama.config.weatherCategories[groupKey].label,
          }),
        },
        entries: [],
      };

      for (const k in ryuutama.config.weatherTypes) {
        if (ryuutama.config.weatherTypes[k].category !== groupKey) continue;
        const checked = weathers.has(k);
        const disabled = weathers.has(`ALL:${groupKey}`) || weathers.has("ALL");
        group.entries.push({
          checked, disabled, value: k,
          label: ryuutama.config.weatherTypes[k].label,
        });
      }

      context.groups.push(group);
    }

    context.hasAll = weathers.has("ALL");

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const processed = super._processFormData(event, form, formData);

    const values = processed.weather.filter(_ => _);
    foundry.utils.setProperty(processed, "system.gear.habitat.weather", values);
    delete processed.weather;

    return processed;
  }
}
