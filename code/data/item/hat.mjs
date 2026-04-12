import GearData from "./templates/gear.mjs";

export default class HatData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      itemGroup: "travelingGear",
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 204,
      defaultArtwork: "systems/ryuutama/assets/icons/items/hat.svg",
      sort: 201,
    },
    { inplace: false },
  ));
}
