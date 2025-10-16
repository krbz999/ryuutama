import AdvancementConfigurationDialog from "./advancement-configuration-dialog.mjs";

export default class ResourceAdvancementDialog extends AdvancementConfigurationDialog {
  /** @override */
  static get INPUT_TEMPLATE() {
    return "systems/ryuutama/templates/apps/advancement/resource.hbs";
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureSubmit(event, form, formData) {
    formData = foundry.utils.expandObject(formData.object);

    if (event instanceof SubmitEvent) {
      const source = this.actor.system._source.resources;
      const update = {
        "system.resources.stamina.max": source.stamina.max + formData.choice.chosen.stamina,
        "system.resources.mental.max": source.mental.max + formData.choice.chosen.mental,
      };
      return { result: update, type: "actor" };
    }

    else {
      const total = formData.choice.chosen.stamina + formData.choice.chosen.mental;
      this.element.querySelector("[type=submit]").disabled = total !== 3;
    }
  }
}
