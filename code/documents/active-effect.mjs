export default class RyuutamaActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    // Select the strength of the status.
    if (!("strength" in options)) {
      const fields = CONFIG.ActiveEffect.dataModels.status.schema.fields.strength.fields;

      const result = await foundry.applications.api.Dialog.input({
        window: {
          title: `${game.i18n.localize("RYUUTAMA.STATUS.HUD_APPLY.title")}: ${effectData.name}`,
        },
        position: {
          width: 420,
        },
        content: [
          fields.value.toFormGroup({}, { autofocus: true, value: 4, placeholder: "4" }).outerHTML,
          fields.bypass.toFormGroup({}, {}).outerHTML,
        ].join(""),
      });
      if (!result) throw new Error("No status effect strength was selected.");
      foundry.utils.mergeObject(effectData, result);
    } else {
      foundry.utils.setProperty(effectData, "system.strength.value", options.strength);
    }

    effectData.type = "status";
    return super._fromStatusEffect(statusId, effectData, options);
  }
}
