import AdvancementSheet from "../../applications/sheets/advancement-sheet.mjs";
import PseudoDocument from "../pseudo-document.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

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
      [ryuutama.data.advancement.ResourceAdvancement.TYPE]: ryuutama.data.advancement.ResourceAdvancement,
      [ryuutama.data.advancement.StatIncreaseAdvancement.TYPE]: ryuutama.data.advancement.StatIncreaseAdvancement,
      [ryuutama.data.advancement.StatsAdvancement.TYPE]: ryuutama.data.advancement.StatsAdvancement,
      [ryuutama.data.advancement.StatusImmunityAdvancement.TYPE]: ryuutama.data.advancement.StatusImmunityAdvancement,
      [ryuutama.data.advancement.TypeAdvancement.TYPE]: ryuutama.data.advancement.TypeAdvancement,
      [ryuutama.data.advancement.WeaponAdvancement.TYPE]: ryuutama.data.advancement.WeaponAdvancement,
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

  /* -------------------------------------------------- */

  /**
   * Present a user interface for configuring an advancement of this type,
   * the result of which is later created on the actor.
   * @param {RyuutamaActor} actor
   * @returns {Promise<{ result: any, type: string }|null>}
   */
  static async configure(actor) {
    return null;
  }
}
