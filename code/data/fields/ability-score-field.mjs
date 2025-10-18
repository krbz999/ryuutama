/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { NumberField } = foundry.data.fields;

export default class AbilityScoreField extends NumberField {
  /** @inheritdoc */
  static get _defaults() {
    return Object.assign(super._defaults, {
      nullable: false,
      required: true,
      initial: 4,
      restricted: false,
    });
  }

  /* -------------------------------------------------- */

  /**
   * For addition, upgrade, and downgrade, as well as base value, these are the possible options.
   * @type {number[]}
   */
  get BASE_OPTIONS() {
    const options = this.VALUES;
    if (this.options.restricted) {
      options.shift();
      options.pop();
    }
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * For overrides, the superset of die faces.
   * @type {number[]}
   */
  get VALUES() {
    return [2, 4, 6, 8, 10, 12, 20];
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
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: String(delta),
    };
    const final = this._applyChangeAdd(value, delta, actor, change);
    foundry.utils.setProperty(actor, path, final);
  }

  /* -------------------------------------------------- */

  /** @override */
  _applyChangeAdd(value, delta, model, change) {
    if (![-1, 1].includes(delta)) return value;

    const options = this.BASE_OPTIONS;
    if (delta === -1) options.reverse();

    const index = options.indexOf(value);
    if (index === -1) return 4;

    return options[index + 1] ?? options.at(-1);
  }

  /* -------------------------------------------------- */

  /** @override */
  _applyChangeOverride(value, delta, model, change) {
    if (!this.VALUES.includes(delta)) return value;
    return delta;
  }

  /* -------------------------------------------------- */

  /** @override */
  _applyChangeMultiply(value, delta, model, change) {
    return value;
  }

  /* -------------------------------------------------- */

  /** @override */
  _applyChangeUpgrade(value, delta, model, change) {
    const options = this.BASE_OPTIONS;
    if (!options.includes(delta)) return value;
    return Math.max(value, delta);
  }

  /* -------------------------------------------------- */

  /** @override */
  _applyChangeDowngrade(value, delta, model, change) {
    const options = this.BASE_OPTIONS;
    if (!options.includes(delta)) return value;
    return Math.min(value, delta);
  }
}
