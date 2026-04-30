import GearData from "./templates/gear.mjs";

export default class HatData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 204,
      defaultArtwork: "systems/ryuutama/assets/icons/items/hat.svg",
      itemGroup: "travelingGear",
      sort: 201,
    },
    { inplace: false },
  ));
}
