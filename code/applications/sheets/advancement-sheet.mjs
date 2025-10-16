import { PseudoDocumentSheet } from "../api/_module.mjs";

export default class AdvancementSheet extends PseudoDocumentSheet {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/sheets/advancement-sheet/form.hbs",
      classes: ["standard-form"],
    },
  };
}
