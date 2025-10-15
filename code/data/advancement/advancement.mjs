import AdvancementSheet from "../../applications/sheets/advancement-sheet.mjs";
import PseudoDocument from "../pseudo-document.mjs";

export default class Advancement extends PseudoDocument {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static get documentConfig() {
    return {
      base: Advancement,
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static documentName = "Advancement";

  /* -------------------------------------------------- */

  /** @override */
  static embedded = "advancements";

  /* -------------------------------------------------- */

  /** @override */
  static get sheetClass() {
    return AdvancementSheet;
  }
}
