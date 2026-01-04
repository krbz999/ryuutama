export default class BaseData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      source: new ryuutama.data.fields.SourceField(),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.ACTOR",
    "RYUUTAMA.SOURCE",
  ];
}
