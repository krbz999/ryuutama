import GearData from "./templates/gear.mjs";

export default class ShoesData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 201,
      defaultArtwork: "systems/ryuutama/assets/icons/items/shoes.svg",
      itemGroup: "travelingGear",
      sort: 203,
    },
    { inplace: false },
  ));
}
