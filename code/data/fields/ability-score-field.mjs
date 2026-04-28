/**
 * @import AbilityModel from "../ability-model.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { NumberField } = foundry.data.fields;

/**
 * A numeric field that handles die size steps. A parent DataModel can define
 * whether the '2' and '20' options are naturally allowed.
 */
export default class AbilityScoreField extends NumberField {
  /** @inheritdoc */
  static get _defaults() {
    return Object.assign(super._defaults, {
      nullable: false,
      required: true,
      initial: 4,
      integer: true,
      min: 2,
      max: 20,
    });
  }

  /* -------------------------------------------------- */

  /**
   * For addition, upgrade, and downgrade, as well as base value, these are the possible options.
   * @type {number[]}
   */
  get baseOptions() {
    if (this.#baseOptions) return this.#baseOptions;
    const options = [...this.#values];
    if (this.isRestricted) {
      options.shift();
      options.pop();
    }
    return this.#baseOptions = Object.freeze(options);
  }

  /**
   * For addition, upgrade, and downgrade, as well as base value, these are the possible options.
   * @type {number[]}
   */
  #baseOptions;

  /* -------------------------------------------------- */

  /**
   * For overrides, the superset of die faces.
   * @type {number[]}
   */
  #values = [2, 4, 6, 8, 10, 12, 20];

  /* -------------------------------------------------- */

  /**
   * Are abilities restricted to 4-12, excluding 2 and 20?
   * @type {boolean}
   */
  get isRestricted() {
    return this.parent.options.restricted;
  }

  /* -------------------------------------------------- */

  /**
   * During data preparation, increase or decrease an actor's ability score.
   * @param {RyuutamaActor} actor   The actor being affected.
   * @param {-1|1} delta            Whether to increase or decrease.
   */
  increase(actor, delta) {
    const path = this.fieldPath;
    const value = foundry.utils.getProperty(actor, path);
    const change = {
      key: this.fieldPath,
      mode: "add",
      value: String(delta),
    };
    const final = this._applyChangeAdd(value, delta, actor, change);
    foundry.utils.setProperty(actor, path, final);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeAdd(value, delta, model, change) {
    /** @type {AbilityModel} */
    const ability = model.system.abilities[this.parent.name];
    switch (delta) {
      case -1:
        ability.decreases++;
        break;
      case 1:
        ability.increases++;
        break;
      default:
        return value;
    }
    return ability.determineDenomination(this.baseOptions);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeSubtract(value, delta, model, change) {
    if ([-1, 1].includes(delta)) return this._applyChangeAdd(value, -delta, model, change);
    return value;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeOverride(value, delta, model, change) {
    if (!this.#values.includes(delta)) return value;
    model.system.abilities[this.parent.name].overridden = true;
    return delta;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeMultiply(value, delta, model, change) {
    return value;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeUpgrade(value, delta, model, change) {
    const options = this.baseOptions;
    if (!options.includes(delta)) return value;
    /** @type {AbilityModel} */
    const ability = model.system.abilities[this.parent.name];
    ability.minimum = delta;
    if (ability.maximum < ability.minimum) ability.maximum = null;
    return ability.determineDenomination(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeDowngrade(value, delta, model, change) {
    const options = this.baseOptions;
    if (!options.includes(delta)) return value;
    /** @type {AbilityModel} */
    const ability = model.system.abilities[this.parent.name];
    ability.maximum = delta;
    if (ability.minimum > ability.maximum) ability.minimum = null;
    return ability.determineDenomination(options);
  }
}
