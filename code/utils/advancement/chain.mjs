import AdvancementNode from "./node.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

/**
 * A container for advancement nodes.
 */
export default class AdvancementChain {
  /**
   * @param {RyuutamaActor} actor
   * @param {number} level
   */
  constructor(actor, level) {
    if (actor.type !== "traveler") {
      throw new Error("Unable to create AdvancementChain for actor types other than 'traveler'.");
    }
    this.#actor = actor;

    if (!level.between(1, 10)) {
      throw new Error("The AdvancementChain level is out of bounds.");
    }
    this.#level = level;
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  #actor;
  get actor() {
    return this.#actor;
  }

  /* -------------------------------------------------- */

  /**
   * Is the chain initialized?
   * @type {boolean}
   */
  #initialized = false;

  /* -------------------------------------------------- */

  /**
   * Is the chain fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return this.nodes().every(node => node.isConfigured);
  }

  /* -------------------------------------------------- */

  /**
   * The level the actor is advancing to.
   * @type {number}
   */
  #level;
  get level() {
    return this.#level;
  }

  /* -------------------------------------------------- */

  /**
   * Nodes in the chain.
   * @type {Set<AdvancementNode>}
   */
  roots = new Set();

  /* -------------------------------------------------- */

  /**
   * Initialize the chain, creating the root nodes and their initial leaves.
   * @returns {Promise<void>}   A promise that resolves once the chain is initialized.
   */
  async initializeRoots() {
    if (this.#initialized) throw new Error("An AdvancementChain cannot be initialized more than once.");
    const types = ryuutama.config.advancement[this.level];
    for (const type of types) {
      const node = new AdvancementNode({ type, chain: this });
      this.#addNode(node);
      if (node.isConfigured) await node._initializeLeafNodes();
    }
    this.#initialized = true;
  }

  /* -------------------------------------------------- */

  /**
   * Add a root node.
   * @param {AdvancementNode} node
   */
  #addNode(node) {
    this.roots.add(node);
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve a root node by its id.
   * @type {string}
   * @returns {AdvancementNode|null}
   */
  get(nodeId) {
    return this.nodes().find(node => node.id === nodeId) ?? null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  * nodes(activeOnly = false) {
    for (const root of this.roots) {
      yield root;
      for (const node of root.descendants(activeOnly)) yield node;
    }
  }
}
