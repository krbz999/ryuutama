/**
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import RyuutamaRegionDocument from "../../documents/region.mjs";
 * @import User from "@client/documents/user.mjs";
 */

/**
 * @typedef EffectDependents
 * @property {Set<string>} [ActiveEffect]     Uuids of dependent effects.
 * @property {Set<string>} [Item]             Uuids of dependent items.
 * @property {Set<string>} [Region]           Uuids of dependent regions.
 *
 * @typedef EffectDependentDocuments
 * @property {Set<RyuutamaActiveEffect>} [ActiveEffect]   Dependent effects.
 * @property {Set<RyuutamaItem>} [Item]                   Dependent items.
 * @property {Set<RyuutamaRegionDocument>} [Region]       Dependent regions.
 *
 * @typedef {RyuutamaActiveEffect|RyuutamaItem|RyuutamaRegionDocument} RegisterableDocument
 */

/**
 * A static class that holds onto entries for dependency relations between effects and
 * their dependent items, regions, and other effects.
 */
export default class EffectDependencyRegistry {
  /**
   * The uuids of effects and their dependent documents.
   * @type {Map<string, EffectDependents>}
   */
  static #effects = new Map();

  /* -------------------------------------------------- */

  /**
   * Register a dependent document.
   * @param {RegisterableDocument} document
   */
  static _registerDependent(document) {
    if (!["ActiveEffect", "Item", "Region"].includes(document.documentName)) return;
    if (!document.isEmbedded) return; // Deleting documents from the world directories is not supported.
    const uuid = document.getFlag(ryuutama.id, "dependency.parent");
    const dependency = fromUuidSync(uuid);
    if (!(dependency instanceof ryuutama.documents.RyuutamaActiveEffect) || !dependency.isEmbedded) return;

    const registered = EffectDependencyRegistry.#effects.getOrInsert(dependency.uuid, {});
    registered[document.documentName] ??= new Set();
    registered[document.documentName].add(document.uuid);
  }

  /* -------------------------------------------------- */

  /**
   * When an effect is deleted, remove its entry from the registry.
   * @param {RyuutamaActiveEffect} effect   The deleted effect.
   */
  static _unregister(effect) {
    EffectDependencyRegistry.#effects.delete(effect.uuid);
  }

  /* -------------------------------------------------- */

  /**
   * Recursively retrieve dependent documents of an ActiveEffect.
   * @param {RyuutamaActiveEffect} effect   The effect.
   * @returns {EffectDependentDocuments}
   */
  static #getDependents(effect) {
    const dependents = {};

    const mainEffects = new Set();

    const getDependents = effect => {
      if (mainEffects.has(effect)) return; // Prevent recursion.
      mainEffects.add(effect);
      const d = EffectDependencyRegistry.#effects.get(effect.uuid) ?? {};
      return Object.entries(d).reduce((acc, [documentName, uuids]) => {
        const documents = Array.from(uuids).map(uuid => fromUuidSync(uuid));
        const isDependent = documents.filter(doc => EffectDependencyRegistry.#isDependent(doc, effect));
        if (isDependent.length) acc[documentName] = new Set(isDependent);
        return acc;
      }, {});
    };

    const recursion = effect => {
      const d = getDependents(effect);
      if (foundry.utils.isEmpty(d)) return;

      for (const [dName, docs] of Object.entries(d)) {
        dependents[dName] ??= new Set();
        docs.forEach(d => dependents[dName].add(d));
      }

      for (const e of d.ActiveEffect ?? []) recursion(e);
    };

    recursion(effect);

    return dependents;
  }

  /* -------------------------------------------------- */

  /**
   * Is the document dependent on a given effect?
   * @param {foundry.abstract.Document} document    The dependent.
   * @param {RyuutamaActiveEffect} effect           The effect dependency.
   * @returns {boolean}
   */
  static #isDependent(document, effect) {
    if (effect.inCompendium) return false;
    if (!document || !(document instanceof foundry.abstract.Document) || document.inCompendium) return false;
    return document.getFlag(ryuutama.id, "dependency.parent") === effect.uuid;
  }

  /* -------------------------------------------------- */

  /**
   * Which User is able to delete all the dependents?
   * @param {RyuutamaActiveEffect} effect   The effect with dependents.
   * @returns {User|null|false}             The User able to delete all dependents, or `null` if no User was needed,
   *                                        or `false` if a User was needed but none was found.
   */
  static _getDesignatedUser(effect) {
    const dependents = EffectDependencyRegistry.#getDependents(effect);
    if (foundry.utils.isEmpty(dependents)) return null;

    const allowed = user => user.active && Object.values(dependents)
      .every(documents => documents.every(document => document.canUserModify(user, "delete")));

    const user = game.users.getDesignatedUser(allowed);
    if (!user) return false; // A User was needed but none was found.
    return user;
  }

  /* -------------------------------------------------- */

  /**
   * Delete documents that are dependent on an effect.
   * @param {RyuutamaActiveEffect} effect                     The effect.
   * @returns {Promise<foundry.abstract.Document[][]|null>}   A promise that resolves to the deleted documents.
   */
  static async _expireDependents(effect) {
    const dependents = EffectDependencyRegistry.#getDependents(effect);

    const batches = [];
    Object.entries(dependents).forEach(([documentName, documents]) => {
      documents.forEach(document => {
        batches.push({
          documentName,
          action: "delete",
          ids: [document.id],
          parent: document.parent,
          // Do not delete contents of containers; if a container was added as a dependent,
          // then its contents were also each added as dependents.
          deleteContents: false,
          isDependentDeletion: true,
        });
      });
    });

    return foundry.documents.modifyBatch(batches);
  }

  /* -------------------------------------------------- */

  /**
   * Mark a document to be dependent on an effect.
   * @param {RegisterableDocument} document
   * @param {RyuutamaActiveEffect} effect   The dependency effect.
   * @returns {Promise<boolean>}
   */
  static async registerDependency(document, effect) {
    const isValid = ["ActiveEffect", "Item", "Region"].includes(document.documentName)
      && (effect.documentName === "ActiveEffect")
      && (document.uuid !== effect.uuid)
      && document.isEmbedded && effect.isEmbedded
      && !document.inCompendium && !effect.inCompendium;

    if (!isValid) {
      console.error("Invalid parameters provided for assigning dependency.");
      return false;
    }

    await document.setFlag(ryuutama.id, "dependency.parent", effect.uuid);
    return true;
  }
}
