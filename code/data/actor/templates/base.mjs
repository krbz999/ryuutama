/**
 * @typedef ActorSubtypeMetadata
 * @property {string} [defaultArtwork]    The default image used for an actor of this type.
 */

/**
 * Base class that all other actor data models inherit from.
 */
export default class BaseData extends foundry.abstract.TypeDataModel {
  /**
   * Subtype specific metadata.
   * @type {ActorSubtypeMetadata}
   */
  static metadata = Object.freeze({});

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["RYUUTAMA.ACTOR"];
}
