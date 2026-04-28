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
}
