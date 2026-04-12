import GearData from "./templates/gear.mjs";

export default class StaffData extends GearData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      createGroup: "RYUUTAMA.ITEM.CREATE_GROUP.travelingGear",
      createSort: 203,
      defaultArtwork: "systems/ryuutama/assets/icons/items/staff.svg",
      sort: 205,
    },
    { inplace: false },
  ));
}
