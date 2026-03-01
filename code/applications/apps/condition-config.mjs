import DocumentConfig from "../api/document-config.mjs";

export default class ConditionConfig extends DocumentConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/condition-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.CONDITION.title", { name: this.document.name });
  }
}
