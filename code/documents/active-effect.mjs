export default class RyuutamaActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    // Select the strength of the status.
    if (!foundry.utils.hasProperty(effectData, "system.strength.value")) {
      const result = await foundry.applications.api.Dialog.input({
        window: {
          title: `${game.i18n.localize("RYUUTAMA.STATUS.HUD_APPLY.title")}: ${effectData.name}`,
        },
        position: {
          width: 420,
        },
        content: foundry.applications.fields.createFormGroup({
          label: game.i18n.localize("RYUUTAMA.STATUS.HUD_APPLY.label"),
          hint: game.i18n.localize("RYUUTAMA.STATUS.HUD_APPLY.hint"),
          input: foundry.applications.elements.HTMLRangePickerElement.create({
            name: "system.strength.value",
            value: 4, min: 1, max: 20, step: 1,
            autofocus: true,
          }),
        }).outerHTML,
      });
      if (!result) throw new Error("No status effect strength was selected.");
      foundry.utils.mergeObject(effectData, result);
    }

    effectData.type = "status";
    return super._fromStatusEffect(statusId, effectData, options);
  }
}
