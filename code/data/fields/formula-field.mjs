/**
 * @import { StringFieldOptions } from "@common/data/_types.mjs";
 */

/**
 * @typedef _FormulaFieldOptions
 * @property {boolean} [deterministic=false]    Is this formula not allowed to have dice values?
 *
 * @typedef {StringFieldOptions & _FormulaFieldOptions} FormulaFieldOptions
 */

/**
 * Special case StringField which represents a formula.
 */
export default class FormulaField extends foundry.data.fields.StringField {

  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      required: true,
      deterministic: false,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _validateType(value) {
    const roll = new foundry.dice.Roll(value.replace(/@([a-z.0-9_-]+)/gi, "1"));
    roll.evaluateSync({ strict: false });
    if (this.options.deterministic && !roll.isDeterministic) throw new Error(`must not contain dice terms: ${value}`);
    super._validateType(value);
  }

  /* -------------------------------------------------- */
  /*   Form Field Integration                           */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  toFormGroup(groupConfig = {}, inputConfig = {}) {
    groupConfig.classes ||= [];
    groupConfig.classes.push("formula-input");
    return super.toFormGroup(groupConfig, inputConfig);
  }

  /* -------------------------------------------------- */

  /** @inheritDoc */
  _toInput(config) {
    const input = super._toInput(config);
    if (input.tagName !== "INPUT") return input;
    config.value ??= this.getInitialValue({}) ?? "";
    return foundry.applications.elements.HTMLFormulaInputElement.create(config);
  }

  /* -------------------------------------------------- */
  /*   Active Effect Integration                        */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _castChangeDelta(delta, replacementData = {}) {
    return this._cast(delta).trim();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeAdd(value, delta, model, change) {
    if (!value) return delta;
    const operator = delta.startsWith("-") ? "-" : "+";
    delta = delta.replace(/^[+-]/, "").trim();
    return `${value} ${operator} ${delta}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeSubtract(value, delta, model, change) {
    if (!value) return `-(${delta})`;
    return `${value} - (${delta})`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeMultiply(value, delta, model, change) {
    if (!value) return value;
    if (new foundry.dice.Roll(value).terms.length > 1) value = `(${value})`;
    if (new foundry.dice.Roll(delta).terms.length > 1) delta = `(${delta})`;
    return `${value} * ${delta}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeUpgrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new foundry.dice.Roll(value).terms;
    if ((terms.length === 1) && (terms[0].fn === "max")) return value.replace(/\)$/, `, ${delta})`);
    return `max(${value}, ${delta})`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _applyChangeDowngrade(value, delta, model, change) {
    if (!value) return delta;
    const terms = new foundry.dice.Roll(value).terms;
    if ((terms.length === 1) && (terms[0].fn === "min")) return value.replace(/\)$/, `, ${delta})`);
    return `min(${value}, ${delta})`;
  }
}
