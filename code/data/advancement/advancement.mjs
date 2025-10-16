import AdvancementSheet from "../../applications/sheets/advancement-sheet.mjs";
import PseudoDocument from "../pseudo-document.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
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
      [ryuutama.data.advancement.HabitatAdvancement.TYPE]: ryuutama.data.advancement.HabitatAdvancement,
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

  /**
   * A handlebars template used for rendering this advancement when leveling up.
   * @type {string}
   */
  static CONFIGURE_TEMPLATE = "";

  /* -------------------------------------------------- */

  /** @override */
  static get sheetClass() {
    return AdvancementSheet;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare data when this advancement is presented when leveling up.
   * @param {object} context    Current context. **will be mutated**
   * @param {object} options    Rendering options.
   * @returns {Promise<void>}
   */
  static async _prepareAdvancementContext(context, options) {
    context.fields = this.schema.fields;
    context.title = game.i18n.format("RYUUTAMA.PSEUDO.ADVANCEMENT.configureTitle", {
      name: game.i18n.localize(`TYPES.Advancement.${this.TYPE}`),
    });
  }

  /* -------------------------------------------------- */

  /**
   * Provide any part listeners.
   * @this AdvancementDialog
   * @param {string} partId                 The unique part id.
   * @param {HTMLFormElement} htmlElement   The rendered form element.
   * @param {object} options                Rendering options.
   */
  static _attachPartListeners(partId, htmlElement, options) {}

  /* -------------------------------------------------- */

  /**
   * Determine whether the form configuration is valid.
   * @param {FormDataExtended} formData
   */
  static _determineValidity(formData) {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Determine the result of this advancement.
   * @param {FormDataExtended} formData
   * @returns {object}
   * @abstract
   */
  static _determineResult(formData) {
    throw new Error("A subclass of Advancement must override _determineResult.");
  }
}
