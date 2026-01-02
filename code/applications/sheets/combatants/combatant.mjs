export default class RyuutamaCombatantSheet extends foundry.applications.sheets.CombatantConfig {
  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/sheets/combatant-sheet/form.hbs",
      classes: ["standard-form"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.document.system.schema.fields;
    context.buttons = [{ type: "submit", label: this.title, icon: "fa-solid fa-floppy-disk" }];
    return context;
  }
}
