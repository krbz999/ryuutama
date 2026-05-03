/**
 * System implementation of the ActiveEffect document class.
 * @extends foundry.documents.ActiveEffect
 */
export default class RyuutamaActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  static async createDialog(data, createOptions, { types, ...dialogOptions } = {}, renderOptions) {
    types = (types ?? this.TYPES).filter(type => ![CONST.BASE_DOCUMENT_TYPE, "status"].includes(type));
    return super.createDialog(data, createOptions, { types, ...dialogOptions }, renderOptions);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async _fromStatusEffect(statusId, effectData, options) {
    // Select the strength of the status.
    if (Object.values(ryuutama.CONST.STATUS_EFFECTS).includes(statusId)) {
      effectData.type = "status";
      if (!("strength" in options)) {
        const fields = CONFIG.ActiveEffect.dataModels.status.schema.fields.strength.fields;

        const rootId = [foundry.utils.randomID(), statusId].join("-");

        const result = await foundry.applications.api.Dialog.input({
          window: {
            title: `${_loc("RYUUTAMA.EFFECT.STATUS.configureStrength")}: ${effectData.name}`,
          },
          position: {
            width: 420,
          },
          content: [
            fields.value.toFormGroup({ rootId }, { autofocus: true, value: 4 }).outerHTML,
            fields.bypass.toFormGroup({ rootId }, {}).outerHTML,
          ].join(""),
        });
        if (!result) throw new Error("No status effect strength was selected.");
        foundry.utils.mergeObject(effectData, result);
      } else {
        foundry.utils.setProperty(effectData, "system.strength.value", options.strength);
      }
    }

    return super._fromStatusEffect(statusId, effectData, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source, options, _state) {
    const prefix = "system.mastered.weapons.";
    (source.changes ?? source.system?.changes ?? []).forEach(change => {
      if (!change.key?.startsWith?.(prefix)) return;
      change.value = change.key.slice(prefix.length);
      change.key = prefix.slice(0, prefix.length - 1);
      change.type = "add";
    });
    return super.migrateData(source, options, _state);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _applyChangeUnguided(targetDoc, change, changes, options = {}) {
    // FIXME: This method is called when trying to insert a new property in a TypedObjectField
    // as TOF does not find an element to use. Currently this is only relevant for token detection modes.

    /**
     * "If non-persisted fields end up being viewed as suitable to take on that
     * replacement role, unguided changes might one day at the core level be locked
     * down to flag values and other similarly unstructured object fields."
     */
    if (!change.key || !(change.key.startsWith?.("flags.") || (targetDoc.documentName === "Token"))) return;
    super._applyChangeUnguided(targetDoc, change, changes, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (this.parent?.type === "party") return false;

    if (options.dependencyUuid) {
      const { type } = foundry.utils.parseUuid(options.dependencyUuid) ?? {};
      if (type === "ActiveEffect")
        this.updateSource({ [`flags.${ryuutama.id}.dependency.parent`]: options.dependencyUuid });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    ryuutama.helpers.registries.EffectDependencyRegistry._registerDependent(this);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preDelete(options, user) {
    if ((await super._preDelete(options, user)) === false) return false;

    // This is a dependent effect being deleted.
    if (options.dependentDeletionDesignatedUser || options.isDependentDeletion) return;

    // Designate User to perform deletion of dependents.
    const designatedUser = ryuutama.helpers.registries.EffectDependencyRegistry._getDesignatedUser(this);
    if (designatedUser === false) {
      // A user was needed but no designated user was found.
      ui.notifications.warn("RYUUTAMA.EFFECT.unableToDeleteDueToDependents", { format: { effect: this.name } });
      return false;
    } else if (designatedUser === null) {
      // No designated user was needed.
      return;
    } else {
      // A designated User was found.
      options.dependentDeletionDesignatedUser = designatedUser.id;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    if ((options.dependentDeletionDesignatedUser === userId) && !options.isDependentDeletion) {
      ryuutama.helpers.registries.EffectDependencyRegistry._expireDependents(this);
    }

    // Remove from registry *after* expiration.
    ryuutama.helpers.registries.EffectDependencyRegistry._unregister(this);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async deleteDialog(options = {}, operation = {}) {
    let message;
    const user = ryuutama.helpers.registries.EffectDependencyRegistry._getDesignatedUser(this);
    switch (user) {
      case false:
        message = _loc("RYUUTAMA.EFFECT.unableToDeleteDueToDependents", { effect: this.name });
        foundry.utils.setProperty(options, "yes.disabled", true);
        break;
      case null:
        return super.deleteDialog(options, operation);
      default:
        message = _loc("RYUUTAMA.EFFECT.willAlsoDeleteDependents");
    }

    options.render = (event, dialog) => {
      dialog.element.querySelector(".dialog-content").insertAdjacentHTML("beforeend", `<p>${message}</p>`);
    };
    return super.deleteDialog(options, operation);
  }
}
