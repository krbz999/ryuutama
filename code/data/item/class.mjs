import BaseData from "./templates/base.mjs";

const { DocumentUUIDField, NumberField, SetField } = foundry.data.fields;

/**
 * @typedef ClassData
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {string[]} skills
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 * @property {number} tier
 */

export default class ClassData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      skills: new SetField(new DocumentUUIDField({
        embedded: false,
        type: "Item",
        validate: uuid => {
          if (uuid && !uuid.startsWith("Compendium.")) return false;
          const item = fromUuidSync(uuid, { strict: false });
          return !item || (item.type === "skill");
        },
        validationError: "must be a skill item in a compendium",
      })),
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

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/class.hbs";

  /* -------------------------------------------------- */

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {
    context.identifierPlaceholder = ryuutama.utils.createDefaultIdentifier(this.parent._source.name);
    if (context.disabled) {
      const skills = [];
      for (const uuid of this.skills) {
        const item = await fromUuid(uuid);
        if (!item || (item.type !== "skill")) continue;
        skills.push({ item });
      }
      context.classSkills = skills;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (this.parent.parent && !options.advancement) {
      ui.notifications.warn("RYUUTAMA.ITEM.CLASS.creationWarning", { localize: true });
      return false;
    }

    if (!this.identifier) {
      this.parent.updateSource({ "system.identifier": ryuutama.utils.createDefaultIdentifier(this.parent.name) });
    }
  }
}
