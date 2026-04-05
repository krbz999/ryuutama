import GearData from "./templates/gear.mjs";

/**
 * @typedef AccessoryData
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

export default class AccessoryData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 205,
      defaultArtwork: "systems/ryuutama/assets/icons/items/accessory.svg",
      sort: 204,
    },
    { inplace: false },
  ));
}
