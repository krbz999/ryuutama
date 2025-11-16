import IdentifierField from "../fields/identifier-field.mjs";
import BaseData from "./templates/base.mjs";

const { DocumentUUIDField, NumberField, SetField } = foundry.data.fields;

export default class ClassData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      identifier: new IdentifierField(),
      skills: new SetField(new DocumentUUIDField({ embedded: false, type: "Item" })),
      tier: new NumberField({ nullable: false, initial: 1, integer: true, min: 1, max: 2 }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.CLASS",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (this.parent && !options.advancement) {
      ui.notifications.warn("RYUUTAMA.ITEM.CLASS.creationWarning", { localize: true });
      return false;
    }

    if (!this.identifier) {
      this.parent.updateSource({ "system.identifier": ryuutama.utils.createDefaultIdentifier(this.parent.name) });
    }
  }
}
