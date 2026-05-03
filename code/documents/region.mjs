/**
 * System implementation of the RegionDocument document class.
 * @extends foundry.documents.RegionDocument
 */
export default class RyuutamaRegionDocument extends foundry.documents.RegionDocument {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    ryuutama.helpers.registries.EffectDependencyRegistry._registerDependent(this);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (options.dependencyUuid) {
      const { type } = foundry.utils.parseUuid(options.dependencyUuid) ?? {};
      if (type === "ActiveEffect")
        this.updateSource({ [`flags.${ryuutama.id}.dependency.parent`]: options.dependencyUuid });
    }
  }
}
