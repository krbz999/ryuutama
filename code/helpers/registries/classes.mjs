import BaseRegistry from "./registry.mjs";

export default class ClassRegistry extends BaseRegistry {
  /** @inheritdoc */
  static PROPERTIES = ["identifier", "source"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static FIELDS = [
    "system.identifier",
    "system.source.book",
    "system.source.custom",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "class";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeItem(index) {
    const entry = super._initializeItem(index);
    if (!entry) return entry;

    entry.properties.identifier = index.system.identifier
      ? index.system.identifier
      : ryuutama.utils.createDefaultIdentifier(index.name);
    entry.properties.source = index.system.source.custom || index.system.source.book || "";

    if (!entry.properties.identifier) {
      console.warn(`Unable to add class item '${index.uuid}' to the registry.`);
      return null;
    }

    return entry;
  }
}
