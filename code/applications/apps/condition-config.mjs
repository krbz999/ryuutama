import DocumentConfig from "../api/document-config.mjs";

export default class ConditionConfig extends DocumentConfig {
  /** @inheritdoc */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/condition-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return _loc("RYUUTAMA.CONDITION.title", { name: this.document.name });
  }
}
