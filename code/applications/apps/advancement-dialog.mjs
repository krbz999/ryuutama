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
    return game.i18n.format("RYUUTAMA.PSEUDO.ADVANCEMENT.title", {
      name: this.actor.name,
      nth: this.options.level.ordinalString(),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.buttons = [{
      label: "Confirm", icon: "fa-solid fa-check", type: "submit",
      disabled: !this.chain.isFullyConfigured,
    }];
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    // It is assumed that the part id is equal to a node's id.
    const node = this.chain.get(partId);
    if (node) await node.advancement._prepareAdvancementContext(context, options);
    context.rootId = [this.id, partId].join("-");
    return context;
  }

  /* -------------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const parts = {};

    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        const id = node.id;
        parts[id] = {
          id,
          template: node.advancement.constructor.CONFIGURE_TEMPLATE,
          templates: [],
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

    return { ...super._configureRenderParts(options), ...parts };
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
    super._replaceHTML(result, content, options);
    for (const form of content.querySelectorAll("form.advancement")) {
      const partId = form.dataset.applicationPart;
      if (options.parts.includes(partId)) {
        content.querySelector("[data-application-part=advancements]").appendChild(form);

        // It is assumed the part id is equal to the node's id.
        const node = this.chain.get(partId);
        form.style.setProperty("order", node.index);
      } else {
        form.remove();
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const input of this.element.querySelectorAll("input[type=number], input[type=text].delta")) {
      input.addEventListener("focus", () => input.select());
      if (input.classList.contains("delta")) {
        input.addEventListener("change", () => ryuutama.utils.parseInputDelta(input, this.document));
      }
    }
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
    this.render();
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
  static #onSubmit() {
    if (!this.chain.isFullyConfigured) {
      this.#config = null;
      return;
    }

    this.#config = [];
    for (const nodes of this.chain.nodes.values()) {
      for (const node of nodes) {
        const result = node.advancement._getAdvancementResult();
        this.#config.push(result);
      }
    }
  }
}
