import BaseData from "./templates/base.mjs";

const { DocumentUUIDField, SetField } = foundry.data.fields;

export default class ClassData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      skills: new SetField(new DocumentUUIDField({ embedded: false, type: "Item" })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.CLASS",
  ];
}
