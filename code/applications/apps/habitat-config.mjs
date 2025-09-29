import DocumentConfig from "../api/document-config.mjs";

export default class HabitatConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/habitat-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("RYUUTAMA.HABITAT.CONFIG.title")}: ${this.document.name}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const weathers = new Set(this.document.system._source.gear.habitat.weather);
    const terrains = new Set(this.document.system._source.gear.habitat.terrain);
    const weather = {};
    const terrain = {};

    // WEATHER
    weather.groups = [];
    weather.uncategorized = [];
    for (const weatherType in ryuutama.config.weatherTypes) {
      const category = ryuutama.config.weatherCategories[ryuutama.config.weatherTypes[weatherType].category];
      if (!category) {
        weather.uncategorized.push({
          checked: weathers.has(weatherType),
          disabled: weathers.has("ALL"),
          value: weatherType,
          label: ryuutama.config.weatherTypes[weatherType].label,
        });
        continue;
      }

      let group = weather.groups.find(g => g.head.key === ryuutama.config.weatherTypes[weatherType].category);
      if (!group) {
        group = {
          label: ryuutama.config.weatherCategories[ryuutama.config.weatherTypes[weatherType].category].label,
          entries: [],
          head: {
            checked: weathers.has(`ALL:${ryuutama.config.weatherTypes[weatherType].category}`),
            disabled: weathers.has("ALL"),
            value: ryuutama.config.weatherTypes[weatherType].category,
            key: ryuutama.config.weatherTypes[weatherType].category,
            label: game.i18n.format("RYUUTAMA.WEATHER.CATEGORY.allType", {
              type: ryuutama.config.weatherCategories[ryuutama.config.weatherTypes[weatherType].category].label,
            }),
          },
        };
        weather.groups.push(group);
      }
      group.entries.push({
        checked: weathers.has(weatherType),
        disabled: weathers.has(`ALL:${group.key}`) || weathers.has("ALL"),
        value: weatherType,
        label: ryuutama.config.weatherTypes[weatherType].label,
      });
    }
    weather.hasAll = weathers.has("ALL");

    // TERRAIN
    terrain.groups = [];
    for (const k in ryuutama.config.terrainTypes) {
      const level = ryuutama.config.terrainTypes[k].level;
      let group = terrain.groups.find(g => g.head.level === ryuutama.config.terrainTypes[k].level);
      if (!group) {
        group = {
          label: `localize level ${level} terrains whee`,
          head: {
            level,
            checked: terrains.has(`ALL:${level}`),
            disabled: terrains.has("ALL"),
            label: game.i18n.format("RYUUTAMA.TERRAIN.CATEGORY.allLevel", { level }),
          },
          entries: [],
        };
        terrain.groups.push(group);
      }

      group.entries.push({
        checked: terrains.has(k),
        disabled: terrains.has(`ALL:${level}`) || terrains.has("ALL"),
        value: k,
        label: ryuutama.config.terrainTypes[k].label,
      });
    }
    terrain.hasAll = terrains.has("ALL");
    terrain.groups.sort((a, b) => a.head.level - b.head.level);

    return Object.assign(context, { weather, terrain });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    const processed = super._processFormData(event, form, formData);

    const w = processed.weather.filter(_ => _);
    const t = processed.terrain.filter(_ => _);
    foundry.utils.setProperty(processed, "system.gear.habitat.weather", w);
    foundry.utils.setProperty(processed, "system.gear.habitat.terrain", t);
    delete processed.weather;
    delete processed.terrain;

    return processed;
  }
}
