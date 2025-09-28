import PhysicalData from "./physical.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class GearData extends PhysicalData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      gear: new SchemaField({
        habitat: new SchemaField({
          terrain: new SetField(new StringField()),
          weather: new SetField(new StringField()),
        }),
        strength: new NumberField({ nullable: true, initial: null, integer: true }), // see 'walking stick' p65
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.HABITAT",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    let check = 1;
    if (this.modifiers.has("highQuality")) check++;
    if (this.modifiers.has("plusOne")) check++;
    this.gear.habitat.check = check;

    const weather = {};

    this.gear.habitat.checks = {};
    this.gear.habitat.checks.weather = new Proxy(weather, {
      get: (function(target, prop, receiver) {
        weather[prop] ??= this.getWeatherBonus(prop);
        return weather[prop];
      }).bind(this),
    });

    this.gear.habitat.label = this.#prepareTerrainAndWeatherLabel();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the habitat label.
   * @returns {string}
   */
  #prepareTerrainAndWeatherLabel() {
    const formatter = game.i18n.getListFormatter({ type: "conjunction" });

    const w = (() => {
      const weathers = this.gear.habitat.weather;
      if (weathers.has("ALL")) return game.i18n.localize("RYUUTAMA.WEATHER.CATEGORY.all");
      if (!weathers.size) return null;

      const configs = { cats: ryuutama.config.weatherCategories, types: ryuutama.config.weatherTypes };

      let alls = [];
      let singles = [];

      for (const v of weathers) {
        if ((v in configs.types) && !weathers.has(`ALL:${configs.types[v].category}`)) singles.push(v);
      }
      for (const v in configs.cats) {
        if (weathers.has(`ALL:${v}`)) alls.push(v);
      }

      alls = alls.map(v => configs.cats[v].label);
      singles = singles.map(v => configs.types[v].label);

      if (!alls.length && !singles.length) return null;

      if (alls.length) alls = game.i18n.format("RYUUTAMA.WEATHER.CATEGORY.allType", { type: formatter.format(alls) });
      return formatter.format(alls.length ? [alls, ...singles] : singles);
    })();

    const t = (() => {
      const terrains = this.gear.habitat.terrain;
      if (terrains.has("ALL")) return game.i18n.localize("RYUUTAMA.TERRAIN.CATEGORY.all");
      if (!terrains.size) return null;

      let alls = [];
      let singles = [];

      for (const k of terrains) {
        if (k in ryuutama.config.terrainTypes) {
          const level = ryuutama.config.terrainTypes[k].level;
          const hasLevel = terrains.has(`ALL:${level}`);
          if (hasLevel) continue;
          singles.push(ryuutama.config.terrainTypes[k].label);
        } else {
          const level = parseInt(k.replace("ALL:", ""));
          if (isNaN(level)) continue;
          alls.push(String(level));
        }
      }

      if (!alls.length && !singles.length) return null;

      if (alls.length) alls = game.i18n.format("RYUUTAMA.TERRAIN.CATEGORY.allLevel", { level: formatter.format(alls) });
      return formatter.format(alls.length ? [alls, ...singles] : singles);
    })();

    if (!w && !t) return game.i18n.localize("RYUUTAMA.HABITAT.noTerrainWeather");
    if (w && t) return formatter.format([w, t]);
    return w || t;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve weather bonus for checks derived from this item.
   * @param {string} weather    A key in `weatherTypes`.
   * @returns {number}
   */
  getWeatherBonus(weather) {
    const config = ryuutama.config.weatherTypes[weather];
    const conditions = this.gear.habitat.weather;
    let applies = false;
    if (conditions.has("ALL")) applies = true;
    else if (!config) applies = false;
    else if (conditions.has(`ALL:${config.category}`)) applies = true;
    else if (conditions.has(weather)) applies = true;

    return applies ? this.gear.habitat.check : 0;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve the terrain bonus for checks derived from this item.
   * @param {string} terrain            A key in `terrainTypes`.
   * @param {object} [options={}]
   * @param {number} [options.level]    The level of the terrain.
   * @returns {number}
   */
  getTerrainBonus(terrain, { level } = {}) {
    const config = ryuutama.config.terrainTypes[terrain];
    if (!config) return 0;

    level ??= -Infinity;
    const h = this.gear.habitat;
    if (h.levels < level) return 0;

    let applies = false;
    if (h.terrain.has("ALL")) applies = true;
    else if (h.terrain.has(terrain)) applies = true;

    return applies ? this.gear.habitat.check : 0;
  }
}
