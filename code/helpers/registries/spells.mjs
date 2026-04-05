import BaseRegistry from "./registry.mjs";

export default class SpellRegistry extends BaseRegistry {
  /** @inheritdoc */
  static PROPERTIES = ["category", "identifier", "level", "source"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static FIELDS = [
    "system.category.value",
    "system.identifier",
    "system.source.book",
    "system.source.custom",
    "system.spell.level",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "spell";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeItem(index) {
    const entry = super._initializeItem(index);
    if (!entry) return entry;

    entry.properties.category = index.system.category.value;
    entry.properties.identifier = index.system.identifier
      ? index.system.identifier
      : ryuutama.utils.createDefaultIdentifier(index.name);
    entry.properties.level = index.system.spell.level;
    entry.properties.source = index.system.source.custom || index.system.source.book || "";

    const valid = entry.properties.identifier
      && Object.values(ryuutama.CONST.SPELL_CATEGORIES).includes(entry.properties.category)
      && Object.values(ryuutama.CONST.SPELL_LEVELS).includes(entry.properties.level);

    if (!valid) {
      console.warn(`Unable to add spell item '${index.uuid}' to the registry.`);
      return null;
    }

    return entry;
  }
}
