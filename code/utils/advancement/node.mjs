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
   * The depth of this node.
   * @type {number}
   */
  get depth() {
    let depth = 0;
    let parent = this.parent;
    while (parent) {
      depth++;
      parent = parent.parent;
    }
    return depth;
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
   * A sorting index in the application for the form of this node.
   * @type {number}
   */
  get index() {
    if (this.parent) {
      const first = this.parent.index + 1;
      const second = this.parent.children.indexOf(this) + 1;
      return first * 10 + second;
    }

    let i = 0;
    loop: for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        if (node === this) break loop;
        if (!node.depth) i++;
      }
    }
    return i;
  }

  /* -------------------------------------------------- */

  /**
   * Is this node fully configured?
   * @type {boolean}
   */
  get isConfigured() {
    return this.advancement.isConfigured;
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
    const advancement = new Cls({ level: this.level, type: this.type }, {
      chain: this.chain,
      isEphemeral: true,
      parent: this.actor,
    });
    this.#advancement = advancement;
    return this.advancement;
  }

  /* -------------------------------------------------- */

  /**
   * When this advancement is modified, reconstruct relevant parts of the chain.
   * @returns {Promise<void>}
   */
  async _initializeLeafNodes() {
    const children = this.children;
    const types = await this.advancement._getChildTypes();
    for (const type of types) {
      // Child already exists, do nothing.
      const child = children.find(child => child.type === type);
      if (child) {
        children.splice(children.indexOf(child), 1);
        continue;
      }

      // Create new child (and its children).
      const node = new this.constructor({ type, chain: this.chain, parent: this });
      this.chain.addNode(node);
      await node._initializeLeafNodes();
    }

    // Remove no-longer valid children.
    for (const node of children) this.chain.removeNode(node);
  }

  /* -------------------------------------------------- */

  /**
   * Traverse descendant nodes.
   * @yields {AdvancementNode}
   */
  * descendants() {
    for (const child of this.children) {
      yield child;
      yield* child.descendants();
    }
  }
}
