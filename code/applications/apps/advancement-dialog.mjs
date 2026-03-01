import AdvancementChain from "../../utils/advancement/chain.mjs";

/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import Advancement from "../../data/advancement/advancement.mjs";
 */

const { Application, HandlebarsApplicationMixin } = foundry.applications.api;

export default class AdvancementDialog extends HandlebarsApplicationMixin(Application) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["advancement-dialog"],
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: AdvancementDialog.#onSubmit,
    },
    window: {
      contentClasses: ["standard-form"],
    },
    position: {
      width: 580,
      height: "auto",
    },
    actions: {},
    actor: null,
    chain: null,
    level: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    advancements: {
      template: "systems/ryuutama/templates/apps/advancement-dialog/advancements.hbs",
      classes: ["scrollable"],
      scrollable: [""],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /**
   * The actor advancing.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.options.actor;
  }

  /* -------------------------------------------------- */

  /**
   * @type {Record<string, typeof Advancement>}
   */
  get advancementClasses() {
    const types = ryuutama.config.advancement[this.options.level];
    const classes = {};
    for (const type of types) {
      const Cls = ryuutama.data.advancement.Advancement.documentConfig[type];
      if (Cls) classes[type] = Cls;
      else console.warn(`The type '${type}' is not a valid Advancement subclass.`);
    }
    return classes;
  }

  /* -------------------------------------------------- */

  /**
   * The internal advancement chain.
   * @type {AdvancementChain}
   */
  get chain() {
    return this.options.chain;
  }

  /* -------------------------------------------------- */

  /**
   * The data that will be submitted.
   * @type {object[]|null}
   */
  #config = null;
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.PSEUDO.ADVANCEMENT.title", {
      name: this.actor.name,
      nth: this.options.level.ordinalString(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case "footer":
        context.buttons = [{
          label: "Confirm", icon: "fa-solid fa-check", type: "submit", disabled: !this.chain.isConfigured,
        }];
        break;
      case "advancements":
        context.advancementIds = options.parts.filter(part => !["footer", "advancements"].includes(part));
        break;
      default:
        // It is assumed that the part id is equal to a node's id.
        await this.chain.get(partId).advancement._prepareAdvancementContext(context, options);
        break;
    }

    context.rootId = [this.id, partId].join("-");
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    let parts = {};

    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        const id = node.id;
        parts[id] = {
          id,
          template: node.advancement.constructor.CONFIGURE_TEMPLATE,
          classes: ["standard-form", "advancement"],
          forms: {
            form: {
              submitOnChange: true,
              closeOnSubmit: false,
            },
          },
        };
      }
    }

    parts = { ...super._configureRenderParts(options), ...parts };
    if (!options.isFirstRender) {
      delete parts.advancements;
      delete parts.footer;
    }
    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.classes.push(ryuutama.id);
    return options;
  }

  /* -------------------------------------------------- */

  /** @override */
  _replaceHTML(result, content, options) {
    if (options.isFirstRender) return super._replaceHTML(result, content, options);
    content = this.element.querySelector("[data-application-part=advancements]");
    return super._replaceHTML(result, content, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preRender(context, options) {
    await super._preRender(context, options);
    if (!options.isFirstRender) {
      for (const form of this.element.querySelectorAll("form.advancement")) {
        const node = this.chain.get(form.dataset.applicationPart);
        if (!node) form.remove();
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const form of this.element.querySelectorAll("form.advancement:not([data-order])")) {
      const node = this.chain.get(form.dataset.applicationPart);
      form.style.setProperty("order", node.index);
      form.dataset.order = node.index;
    }

    for (const input of this.element.querySelectorAll("input[type=number], input[type=text].delta")) {
      input.addEventListener("focus", () => input.select());
      if (input.classList.contains("delta")) {
        input.addEventListener("change", () => ryuutama.utils.parseInputDelta(input, this.document));
      }
    }

    if (!options.isFirstRender) this.element.querySelector("button[type=submit]").disabled = !this.chain.isConfigured;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    if (event.currentTarget.id === this.element.id) return;

    const form = event.currentTarget;
    const partId = form.dataset.applicationPart;

    // It is assumed the part id is equal to the node's id.
    const node = this.chain.get(partId);
    if (!node) {
      throw new Error(`No node was found for part [${partId}].`);
    }

    const formData = new foundry.applications.ux.FormDataExtended(form);
    node.advancement.updateSource(foundry.utils.expandObject(formData.object));
    await node._initializeLeafNodes();

    // Re-render this specific part as well as all parts of descendant nodes that are not rendered.
    const parts = [node.id];
    for (const n of node.descendants()) {
      if (!this.element.querySelector(`[data-application-part="${n.id}"]`)) parts.push(n.id);
    }
    this.render({ parts });
  }

  /* -------------------------------------------------- */

  /**
   * Create an instance of this application the result of which can be awaited.
   * @param {RyuutamaActor} actor         The actor advancing.
   * @param {object} [options={}]
   * @param {number} [options.level]      The level to which the actor is advancing.
   * @returns {Promise<object[]|null>}    A promise that resolves to data used for advancement injection,
   *                                      or `null` if the dialog was cancelled.
   */
  static async create(actor, { level } = {}) {
    level ??= actor.system.details.level + 1;

    const chain = new AdvancementChain(actor, level);
    await chain.initializeRoots();

    const { promise, resolve } = Promise.withResolvers();
    const application = new this({ actor, chain, level });
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /**
   * Submit the form.
   * @this AdvancementDialog
   */
  static async #onSubmit() {
    if (!this.chain.isConfigured) {
      this.#config = null;
      return;
    }

    this.#config = [];
    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        const results = await node.advancement._getAdvancementResults(this.actor);
        this.#config.push(...results);
      }
    }
  }
}
