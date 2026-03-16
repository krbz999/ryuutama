import BaseData from "./templates/base.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

const { DocumentUUIDField, NumberField, SchemaField, SetField } = foundry.data.fields;

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
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    { inventory: false },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      skills: new SetField(new SchemaField({
        uuid: new DocumentUUIDField({
          embedded: false,
          type: "Item",
          validate: uuid => {
            if (uuid && !uuid.startsWith("Compendium.")) return false;
            const item = fromUuidSync(uuid, { strict: false });
            return !item || (item.type === "skill");
          },
          validationError: "must be a skill item in a compendium",
        }),
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

  /** @inheritdoc */
  static migrateData(source, options, _state) {
    if (Array.isArray(source.skills)) {
      source.skills.forEach((schema, i) => {
        if (typeof schema === "string") {
          source.skills[i] = { uuid: schema };
        }
      });
    }
    return super.migrateData(source, options, _state);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/class.hbs";

  /* -------------------------------------------------- */

  /**
   * Gather up the skill items.
   * @returns {Promise<RyuutamaItem[]>}
   */
  async _getSkillItems() {
    const items = await Promise.all(Array.from(this.skills).map(s => fromUuid(s.uuid)));
    return items.filter(_ => _);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareSubtypeContext(sheet, context, options) {
    context.identifierPlaceholder = ryuutama.utils.createDefaultIdentifier(this.parent._source.name);
    const items = await this._getSkillItems();
    const skills = items.map(item => ({ item }));
    context.classSkills = skills;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (this.parent.isEmbedded && !options.advancement) {
      ui.notifications.warn("RYUUTAMA.ITEM.CLASS.creationWarning", { localize: true });
      return false;
    }

    if (!this.identifier) {
      this.parent.updateSource({ "system.identifier": ryuutama.utils.createDefaultIdentifier(this.parent.name) });
    }

    if (!this.parent.isEmbedded) {
      this.parent.updateSource({ "system.tier": 1 });
    }
  }
}
