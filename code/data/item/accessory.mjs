import GearData from "./templates/gear.mjs";

export default class AccessoryData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 205,
      defaultArtwork: "systems/ryuutama/assets/icons/items/accessory.svg",
      itemGroup: "travelingGear",
      sort: 204,
    },
    { inplace: false },
  ));
}
