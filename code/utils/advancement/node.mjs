/**
 * @import Advancement from "../../data/advancement/advancement.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import AdvancementChain from "./chain.mjs";
 */

/**
 * A node of an advancement chain.
 */
export default class AdvancementNode {
  constructor({ chain, type, parent = null }) {
    this.#chain = chain;
    this.#type = type;
    this.#parent = parent;

    this.initializeNode();
  }

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.chain.actor;
  }

  /* -------------------------------------------------- */

  /**
   * The advancement of this node.
   * @type {Advancement}
   */
  #advancement;
  get advancement() {
    return this.#advancement;
  }

  /* -------------------------------------------------- */

  /**
   * The containing advancement chain.
   * @type {AdvancementChain}
   */
  #chain;
  get chain() {
    return this.#chain;
  }

  /* -------------------------------------------------- */

  /**
   * Advancement nodes that have this node as a parent.
   * @type {AdvancementNode[]}
   */
  get children() {
    const children = [];
    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        if (node.parent === this) children.push(node);
      }
    }
    return children;
  }

  /* -------------------------------------------------- */

  /**
   * Unique id to identify this node.
   * @type {string}
   */
  get id() {
    return this.#advancement.id;
  }

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured?
   * @type {boolean}
   */
  get isFullyConfigured() {
    return this.advancement.isFullyConfigured;
  }

  /* -------------------------------------------------- */

  /**
   * The level the actor is advancing to.
   * @type {number}
   */
  get level() {
    return this.chain.level;
  }

  /* -------------------------------------------------- */

  /**
   * A parent node that resulted in the creation of this node.
   * @type {AdvancementNode|null}
   */
  #parent;
  get parent() {
    return this.#parent;
  }

  /* -------------------------------------------------- */

  /**
   * The advancement subtype.
   * @type {string}
   */
  #type;
  get type() {
    return this.#type;
  }

  /* -------------------------------------------------- */

  /**
   * Initialize the node, setting up the advancement.
   * @returns {Advancement}
   */
  initializeNode() {
    const Cls = ryuutama.data.advancement.Advancement.documentConfig[this.type];
    const advancement = new Cls({ level: this.level, type: this.type }, { parent: this.actor });
    this.#advancement = advancement;
    return this.advancement;
  }

  /* -------------------------------------------------- */

  /**
   * Remove the children of this node from the chain.
   * @returns {number}    The number of nodes removed.
   */
  clearChildren() {
    let i = 0;
    for (const child of this.children) {
      const removed = this.chain.removeNode(child);
      if (removed) i++;
    }
    return i;
  }

  /* -------------------------------------------------- */

  /**
   * When this advancement is modified, reconstruct relevant parts of the chain.
   * @returns {Promise<void>}
   */
  async _initializeLeafNodes() {
    this.clearChildren();
    const types = await this.advancement._constructChildren();
    for (const type of types) {
      const node = new this.constructor({ type, chain: this.chain, parent: this });
      this.chain.addNode(node);
      await node._initializeLeafNodes();
    }
  }
}
