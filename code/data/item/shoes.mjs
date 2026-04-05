import GearData from "./templates/gear.mjs";

/**
 * @typedef ShoesData
 * @property {object} description
 * @property {string} description.value
 * @property {object} gear
 * @property {string} gear.custom
 * @property {string} identifier
 * @property {string[]} modifiers
 * @property {object} price
 * @property {number} price.value
 * @property {object} size
 * @property {number} size.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class ShoesData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    { sort: 203 },
    { inplace: false },
  ));
}
