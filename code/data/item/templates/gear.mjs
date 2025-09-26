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
          levels: new NumberField({ nullable: true, initial: null, integer: true }), // eg "level 3 or lower terrain"
        }),
        strength: new NumberField({ nullable: true, initial: null, integer: true }), // see 'walking stick' p65
      }),
    });
  }

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
