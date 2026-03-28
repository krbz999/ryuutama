import RyuutamaBaseActorSheet from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

export default class RyuutamaPartySheet extends RyuutamaBaseActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      consumeRation: RyuutamaPartySheet.#consumeRation,
      placeMembers: RyuutamaPartySheet.#placeMembers,
      removeJourneyAssigned: RyuutamaPartySheet.#removeJourneyAssigned,
      removeMember: RyuutamaPartySheet.#removeMember,
      showMember: RyuutamaPartySheet.#showMember,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/actors/party/header.hbs",
    },
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    members: {
      template: "systems/ryuutama/templates/sheets/actors/party/members.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    rations: {
      template: "systems/ryuutama/templates/sheets/actors/party/rations.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    journey: {
      template: "systems/ryuutama/templates/sheets/actors/party/journey.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/actors/party/details.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "members" },
        { id: "rations" },
        { id: "journey" },
        { id: "details" },
      ],
      initial: "members",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
  };

  /* -------------------------------------------------- */

  /**
   * External actors who re-render this application.
   * @type {Set<RyuutamaActor>}
   */
  #appActors = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.header = await this.#prepareHeader();
    context.members = await this.#prepareMembers();
    context.journey = await this.#prepareJourney();
    context.rations = await this.#prepareRations();
    context.details = await this.#prepareDetails();

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare details context.
   * @returns {Promise<object>}
   */
  async #prepareDetails() {
    const value = this.document.system._source.description.value;
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(value, {
      rollData: this.document.getRollData(),
      relativeTo: this.document,
    });
    return {
      isOwner: this.document.isOwner,
      description: { value, enriched },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare header context.
   * @returns {Promise<object>}
   */
  async #prepareHeader() {
    const members = this.document.system.members;
    const { value, max } = members.reduce((acc, { actor }) => {
      const { value, max } = actor.system.resources.stamina;
      return { value: acc.value + value, max: acc.max + max };
    }, { value: 0, max: 0 });
    const pct = max ? Math.floor(value / max * 100) : 100;
    return {
      canPlaceMembers: game.user.isGM && canvas?.ready && members.size,
      hp: {
        value, max,
        pct: Math.clamp(pct, -100, 100),
        fill: Math.abs(pct),
        id: this.id,
        negative: pct < 0,
      },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare journey context.
   * @returns {Promise<object>}
   */
  async #prepareJourney() {
    const journey = {
      data: this.document.system.journey,
      camping: this.document.system.journey.getStateOfType("camping"),
      direction: this.document.system.journey.getStateOfType("direction"),
    };

    const assigned = [
      journey.camping.primary,
      journey.camping.support,
      journey.direction.primary,
      journey.direction.support,
    ].filter(_ => _);

    const unassigned = this.document.system.members
      .map(m => m.actor)
      .filter(a => !assigned.includes(a));

    journey.actorOptions = unassigned.map(a => ({ value: a.id, label: a.name }));

    return journey;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare members context.
   * @returns {Promise<object[]>}
   */
  async #prepareMembers() {
    const members = [];
    for (const member of this.document.system.members) {
      const ctx = { ...member };
      const { stamina: hp, mental: mp } = member.actor.system.resources;
      Object.assign(ctx, {
        hp, mp,
        rootId: [this.id, member.actor.id].join("-"),
        canView: member.actor.testUserPermission(game.user, "OBSERVER"),
      });
      members.push(ctx);
    }
    return members;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare rations context.
   * @returns {Promise<{ type: string, rations: object[] }[]>}
   */
  async #prepareRations() {
    const rations = {};

    const makeTooltip = (actor, container, ration) => {
      return [
        `<p>${ration.label}</p>`,
        `<p>${_loc("TYPES.Item.container")}: ${container.name}</p>`,
        `<p>${_loc("RYUUTAMA.ACTOR.PARTY.actorOwner")}: ${actor.name}</p>`,
      ].filterJoin("");
    };

    for (const { actor } of this.document.system.members) {
      for (const container of actor.items.documentsByType.container) {
        for (const type of Object.values(ryuutama.CONST.RATION_TYPES)) {
          rations[type] ??= {
            type,
            label: ryuutama.config.rationTypes[type].label,
            rations: [],
          };
          for (const ration of container.system.rations[type]) {
            rations[type].rations.push({
              ...ration, actor, container,
              cssClass: [ration.modifier].filterJoin(" "),
              disabled: !container.isOwner || !this.isEditable,
              icon: ryuutama.config.rationTypes[type].icon,
              tooltip: makeTooltip(actor, container, ration),
            });
          }
        }
      }
    }
    return Object.values(rations);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    for (const { actor } of this.document.system.members) {
      actor.apps[this.id] = this;
      this.#appActors.add(actor);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);
    if (partId === "journey") this.#attachJourneyListeners(htmlElement, options);
  }

  /* -------------------------------------------------- */

  /**
   * Attach listeners to a given part.
   * @param {HTMLElement} element   The rendered element.
   * @param {object} options        Rendering options.
   */
  #attachJourneyListeners(element, options) {
    element.querySelectorAll("select[data-change]").forEach(select => {
      select.addEventListener("change", event => RyuutamaPartySheet.#onChangeJourneyAssigned.call(this, event, select));
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onClose(options) {
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    return super._onClose(options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropActor(event, actor) {
    await this.document.system.addMembers([actor]);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #consumeRation(event, target) {
    const { containerUuid, rationId } = target.closest(".ration").dataset;
    const container = fromUuidSync(containerUuid);
    container.system.removeRation(rationId);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {Event} event                 The initiating change event.
   * @param {HTMLSelectElement} target    The targeted select element.
   */
  static #onChangeJourneyAssigned(event, target) {
    const path = `system.journey.${target.dataset.change}`;
    this.document.system.journey.assignJourneyChange({ [path]: target.value });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #placeMembers(event, target) {
    const configure = !event.shiftKey;
    this.document.system.placeMembers({ configure });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #removeJourneyAssigned(event, target) {
    const path = `system.journey.${target.dataset.journey}`;
    this.document.system.journey.assignJourneyChange({ [path]: null });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #removeMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    this.document.system.removeMembers([actor]);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #showMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    actor.sheet.render({ force: true });
  }
}
