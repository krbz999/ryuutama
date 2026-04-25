/**
 * @typedef DeltaConfig
 * @property {number} value         The field's current value.
 * @property {number} [min]         The field's minimum value.
 * @property {number} [max]         The field's maximum value.
 * @property {boolean} isPercent    Is this a percentage delta?
 * @property {"floor"|"ceil"|"round"} [round="round"]   Rounding method.
 */

/**
 * Parse an change to a numeric value from an input change event.
 * @param {string} delta    The input value.
 * @param {Omit<DeltaConfig, "isPercent">} config
 * @returns {number}
 */
export default function parseDelta(delta, config) {
  /** @type {DeltaConfig} */
  config = foundry.utils.mergeObject(config, {
    isPercent: delta.endsWith("%"),
  }, { inplace: false });
  config.round ||= "round";
  if (config.isPercent) delta = delta.slice(0, delta.length - 1);

  let result;
  switch (true) {
    case delta.startsWith("+"): result = _parseAdd(delta, config); break;
    case delta.startsWith("/"): result = _parseDivide(delta, config); break;
    case delta.startsWith("*"): result = _parseMultiply(delta, config); break;
    case delta.startsWith("-"): result = _parseSubtract(delta, config); break;
    default: result = _parseEqual(delta, config);
  }

  if (isNaN(result)) return config.value;
  if (typeof Math[config.round] === "function") result = Math[config.round](result);
  if (Number.isNumeric(config.min)) result = Math.max(config.min, result);
  if (Number.isNumeric(config.max)) result = Math.min(config.max, result);
  return result;
}

/* -------------------------------------------------- */

/**
 * Parse an addition.
 * @param {string} delta
 * @param {DeltaConfig} config
 * @returns {number}
 */
function _parseAdd(delta, config) {
  delta = Number(delta.slice(1, delta.length));

  if (config.isPercent) {
    return config.value * (1 + delta / 100);
  }

  return config.value + delta;
}

/* -------------------------------------------------- */

/**
 * Parse a division.
 * @param {string} delta
 * @param {DeltaConfig} config
 * @returns {number}
 */
function _parseDivide(delta, config) {
  delta = Number(delta.slice(1, delta.length));

  if (config.isPercent) {
    return config.value / (delta / 100);
  }

  return config.value / delta;
}

/* -------------------------------------------------- */

/**
 * Parse an equalization.
 * @param {string} delta
 * @param {DeltaConfig} config
 * @returns {number}
 */
function _parseEqual(delta, config) {
  if (delta.startsWith("=")) delta = delta.slice(1, delta.length);
  delta = Number(delta);

  if (config.isPercent) {
    return config.max * delta / 100;
  }

  return delta;
}

/* -------------------------------------------------- */

/**
 * Parse a multiplication.
 * @param {string} delta
 * @param {DeltaConfig} config
 * @returns {number}
 */
function _parseMultiply(delta, config) {
  delta = Number(delta.slice(1, delta.length));

  if (config.isPercent) {
    return config.value * (delta / 100);
  }

  return config.value * delta;
}

/* -------------------------------------------------- */

/**
 * Parse a subtraction.
 * @param {string} delta
 * @param {DeltaConfig} config
 * @returns {number}
 */
function _parseSubtract(delta, config) {
  return _parseAdd(`+${delta}`, config);
}
