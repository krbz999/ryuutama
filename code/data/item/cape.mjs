import GearData from "./templates/gear.mjs";

export default class CapeData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 202,
      defaultArtwork: "systems/ryuutama/assets/icons/items/cape.svg",
      itemGroup: "travelingGear",
      sort: 202,
    },
    { inplace: false },
  ));
}
