/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

const { SchemaField, StringField } = foundry.data.fields;

export default class SourceField extends SchemaField {
  constructor(fields, options = {}) {
    fields = {
      book: new StringField({ required: true }),
      custom: new StringField({ required: true }),
    };
    super(fields, options);
  }

  /* -------------------------------------------------- */

  /**
   * Format the source label from a source configuration.
   * @param {RyuutamaActor|RyuutamaItem} [entry]
   * @returns {Promise<string>}
   */
  static async getSourceLabel(entry) {
    if (!entry) return "";
    const { custom, book } = entry.system.source;
    if (custom) return custom;
    if (book) return ryuutama.config.sources[book] ?? book;

    if (!entry.inCompendium && entry._stats.compendiumSource) {
      const source = await fromUuid(entry._stats.compendiumSource);
      return SourceField.getSourceLabel(source);
    }

    else if (entry.inCompendium) {
      const pack = entry.collection;
      switch (pack.metadata.packageType) {
        case "system": return game.system.title;
        case "module": return game.packs.get(pack.packageName).title;
        case "world": return game.world.title;
      }
    }

    return "";
  }
}
