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
  get isFullyConfigured() {
    for (const nodes of this.nodes.values()) {
      for (const node of nodes) {
        if (!node.isFullyConfigured) return false;
      }
    }
    return true;
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
   * Nodes in the chain, categorized by the advancement type.
   * @type {Map<string, AdvancementNode[]>}
   */
  #nodes = new Map();
  get nodes() {
    return this.#nodes;
  }

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
      this.addNode(node);
      await node._initializeLeafNodes();
    }
    this.#initialized = true;
  }

  /* -------------------------------------------------- */

  /**
   * Add a node.
   * @param {AdvancementNode} node
   * @returns {true}
   */
  addNode(node) {
    if (!this.#nodes.get(node.type)) this.#nodes.set(node.type, []);
    this.#nodes.get(node.type).push(node);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Remove a node.
   * @param {AdvancementNode} node
   * @returns {boolean}
   */
  removeNode(node) {
    const nodes = this.nodes.get(node.type);
    const result = nodes.findSplice(n => n === node);
    return result !== null;
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve a node by its id.
   * @type {string}
   * @returns {AdvancementNode|null}
   */
  get(nodeId) {
    for (const nodes of this.nodes.values()) {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
      }
    }
    return null;
  }
}
