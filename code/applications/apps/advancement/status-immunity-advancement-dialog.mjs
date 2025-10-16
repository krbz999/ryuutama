import AdvancementConfigurationDialog from "./advancement-configuration-dialog.mjs";

export default class StatusImmunityAdvancementDialog extends AdvancementConfigurationDialog {
  /** @override */
  static get INPUT_TEMPLATE() {
    return "systems/ryuutama/templates/apps/advancement/status-immunity.hbs";
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons[0].disabled = false;
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureSubmit(event, form, formData) {
    if (event instanceof SubmitEvent) {
      const data = foundry.utils.expandObject(formData.object);
      const Cls = this.options.advancementClass;
      return {
        result: new Cls({ type: Cls.TYPE, ...data }, { parent: this.actor }),
        type: "advancement",
      };
    }
  }
}
