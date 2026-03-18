import BaseData from "./templates/base.mjs";

/**
 * @import { PlaceMembersDialogConfiguration } from "../../applications/apps/actors/place-members-dialog.mjs";
 * @import RegionLayer from "@client/canvas/layers/regions.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaTokenDocument from "../../documents/token.mjs";
 */

const {
  EmbeddedDataField, HTMLField, NumberField, SchemaField, StringField, TypedObjectField,
} = foundry.data.fields;

export default class PartyData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      journey: new EmbeddedDataField(JourneyManagementData, { gmOnly: true }),
      members: new ryuutama.data.fields.MembersField(),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ACTOR.PARTY",
  ];

  /* -------------------------------------------------- */

  /**
   * Actor types that can be members of a party.
   * @type {string[]}
   */
  static ALLOWED_MEMBER_TYPES = Object.freeze(["traveler"]);

  /* -------------------------------------------------- */

  /**
   * Is a given actor valid to be a member of a party?
   * @param {RyuutamaActor} actor
   * @returns {boolean}
   */
  static validMember(actor) {
    return (actor instanceof foundry.documents.Actor)
      && PartyData.ALLOWED_MEMBER_TYPES.includes(actor.type)
      && !actor.inCompendium && !actor.isToken;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: false,
        },
      },
    }, data, { insertKeys: false, insertValues: false, overwrite: true });
    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /**
   * Add members to the party.
   * @param {RyuutamaActor[]} [actors]    The actors to add.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async addMembers(actors = []) {
    const update = Object.fromEntries(this.members.map(m => [m.actor.id, this._source.members[m.actor.id]]));
    actors.forEach(actor => {
      if (!PartyData.validMember(actor) || (actor.id in update)) return;
      update[actor.id] = {};
    });
    await this.parent.update({ "system.members": _replace(update) });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove members from the party.
   * @param {RyuutamaActor[]} [actors]    The actors to remove.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async removeMembers(actors = []) {
    const update = Object.fromEntries(this.members.actors.map(a => [a.id, this._source.members[a.id]]));
    actors.forEach(actor => delete update[actor.id]);
    await this.parent.update({ "system.members": _replace(update) });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Place down the members of this party.
   * @param {object} [options]
   * @param {boolean} [options.configure=true]      Display a configuration dialog?
   * @param {PlaceMembersDialogConfiguration} [options.configuration]
   * @returns {Promise<RyuutamaTokenDocument[]>}    A promise that resolves to the created tokens.
   */
  async placeMembers({ configure = true, configuration } = {}) {
    const sheet = this.parent.sheet;

    configuration = foundry.utils.mergeObject({
      createCombatants: !!game.combat,
      members: this.members.filter(m => !m.actor.getActiveTokens().length).map(m => m.actor.id),
      selectArea: true,
    }, configuration);

    if (configure) {
      const configured = await ryuutama.applications.apps.actors.PlaceMembersDialog.create({
        configuration, document: this.parent,
        parentWindow: sheet.window.windowId,
      });
      if (!configured) return null;
    }

    if (!configuration.members.length) return [];

    const isMaximized = !sheet.window.windowId && sheet.rendered && !sheet.minimized;
    if (isMaximized) await sheet.minimize();

    const promises = configuration.members.map(
      id => this.members.get(id).actor.getTokenDocument({}, { parent: canvas.scene }),
    );
    const tokenData = (await Promise.all(promises)).map(token => token.toObject());
    let tokens = [];

    // Place a region and spawn tokens randomly within.
    if (configuration.selectArea) {
      const minRadius = Math.ceil(Math.sqrt(this.members.size / 2)) * canvas.grid.size;
      const regionData = {
        color: game.user.color.css,
        displayMeasurements: false,
        levels: [canvas.level.id],
        name: _loc("RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.partyMembers"),
        restriction: {
          enabled: true,
          type: "move",
        },
        shapes: [new foundry.data.CircleShapeData({
          radius: minRadius,
          type: "circle", x: 0, y: 0,
        })],
      };

      /** @type {RegionLayer} */
      const layer = canvas.regions;

      /** @type {foundry.documents.RegionDocument} */
      const region = await layer.placeRegion(regionData, { create: false, onRotate: ({ event, shape }) => {
        if (event.ctrlKey) {
          shape.updateSource({ radius: Math.max(shape.radius - canvas.grid.size * Math.sign(event.delta), minRadius) });
          return false;
        }
      } });
      if (region) tokens = await region.spawnTokens(tokenData, { snap: true, avoidOccupied: true });
    }

    // Select each token's position.
    else {
      const names = Iterator.from(tokenData.map(t => t.name));

      const notification = ui.notifications.info("RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.notification", {
        format: { name: names.next().value },
        pct: 0,
        progress: true,
      });

      const updateNotification = ({ index, count }) => {
        const { value: name, done } = names.next();
        notification.update({
          message: _loc(`RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.notification${done ? "Done" : ""}`, { name }),
          pct: (index + 1) / count,
        });
        if (done) notification.element?.classList.add("success");
      };

      tokens = await canvas.tokens.placeTokens(tokenData, {
        create: true, preConfirm: updateNotification, preSkip: updateNotification,
      });
    }

    // Create combatants.
    if (tokens.length && configuration.createCombatants) {
      await getDocumentClass("Token").createCombatants(tokens, { combat: game.combat });
    }

    if (isMaximized) await sheet.maximize();

    return tokens;
  }

  /* -------------------------------------------------- */

  /**
   * Grant every party member a fumble point.
   * @returns {Promise<RyuutamaActor[]>}    A promise that resolves to the updated actors.
   */
  async grantFumblePoint() {
    const actors = this.members
      .map(m => m.actor)
      .filter(a => a.type === "traveler");
    const updates = actors.map(actor => {
      return { _id: actor.id, "system.fumbles.value": actor.system.fumbles.value + 1 };
    });
    return getDocumentClass("Actor").updateDocuments(updates);
  }
}

/* -------------------------------------------------- */

class JourneyManagementData extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      camping: new SchemaField({
        primary: new StringField({ required: true }),
        support: new StringField({ required: true }),
        results: new SchemaField({
          primary: new StringField({ initial: null, required: true }),
          support: new StringField({ initial: null, required: true }),
        }),
      }),
      condition: new SchemaField({
        results: new TypedObjectField(new NumberField({ integer: true, nullable: false })),
      }),
      consumption: new SchemaField({}),
      direction: new SchemaField({
        primary: new StringField({ required: true }),
        support: new StringField({ required: true }),
        results: new SchemaField({
          primary: new StringField({ initial: null, required: true }),
          support: new StringField({ initial: null, required: true }),
        }),
      }),
      travel: new SchemaField({
        results: new TypedObjectField(new NumberField({ integer: true, nullable: false })),
      }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Get derived journey check state for a given type.
   * @param {"camping"|"direction"} type
   * @returns {{ primary: RyuutamaActor|null, support: RyuutamaActor|null, supported: boolean, success: boolean }}
   */
  getStateOfType(type) {
    const members = this.parent.members;
    const primary = members.get(this[type].primary)?.actor ?? null;
    let support = members.get(this[type].support)?.actor ?? null;
    let supported = false;

    if (support === primary) support = null;
    if (support) supported = ["success", "critical"].includes(this[type].results.support);
    const success = !!primary && ["success", "critical"].includes(this[type].results.primary);

    return { primary, support, supported, success };
  }

  /* -------------------------------------------------- */

  /**
   * Reset the journey check data.
   * @returns {Promise<void>}
   * @throws Throws an error if a non-GM attempts to clear the data.
   */
  async resetJourney() {
    if (!game.user.isGM) throw new Error("Only a GM can clear the journey data.");
    await this.parent.parent.update({ "system.journey": _replace({}) });
  }

  /* -------------------------------------------------- */

  /**
   * Update a property on the journey data.
   * If called as a non-GM, a query is made.
   * @param {object} change         Update data to perform on the party actor.
   * @returns {Promise<boolean>}    A promise that resolves to whether a change was made.
   */
  async assignJourneyChange(change) {
    const user = game.users.activeGM;
    if (!user) throw new Error("No GM found for updating journey data.");

    const config = {
      change,
      party: this.parent.parent.uuid,
      type: "handleJourneyManagement",
    };

    if (user.isSelf) return CONFIG.queries[ryuutama.id](config);
    return user.query(ryuutama.id, config, { timeout: 10_000 });
  }

  /* -------------------------------------------------- */

  /**
   * Request that the actor assigned to a specific role performs a check,
   * and then assign the result to the party journey data.
   * This method can be called by non-GMs.
   * @param {"camping"|"direction"} type    The journey check type.
   * @param {boolean} [supporter=false]     Is this a roll to support the primary check?
   * @returns {Promise<boolean>}            A promise that resolves to whether a change was performed.
   */
  async rollAndRequest(type, supporter = false) {
    const state = this.getStateOfType(type);
    const actor = supporter ? state.support : state.primary;
    const bonus = Number(!supporter && state.supported);

    if (!actor.isOwner) {
      throw new Error("You do not have permission to perform this roll.");
    }

    const rollConfig = {
      journeyId: type,
      modifier: bonus,
      target: ui.habitat.targetNumber,
      type: "journey",
    };
    const result = await actor.system.rollCheck(rollConfig);
    if (result === null) return false;

    const roll = Object.values(result.system.parts).find(part => part.type === "check").rolls[0];
    const { isCritical, isFumble, isSuccess, isFailure } = roll;

    let value;
    switch (true) {
      case isCritical: value = "critical"; break;
      case isFumble: value = "fumble"; break;
      case isSuccess: value = "success"; break;
      case isFailure: value = "failure"; break;
    }

    const change = { [`system.journey.${type}.results.${supporter ? "support" : "primary"}`]: value };
    return this.assignJourneyChange(change);
  }

  /* -------------------------------------------------- */

  /**
   * Provide the recovery from camping checks.
   */
  async performCampingRecovery(config = {}) {
    const members = this.parent.members.map(m => m.actor);

    let hp = () => ({});
    let mp = () => ({});
    let con = () => 0;

    switch (this.camping.results.primary) {
      case "critical":
        // all hp, all mp, +1 condition
        hp = () => ({ "stamina.spent": 0 });
        mp = () => ({ "mental.spent": 0 });
        con = () => 1;
        break;
      case "success":
        // double hp, all mp
        hp = actor => ({ "stamina.spent": actor.system.resources.stamina.spent - actor.system.resources.stamina.value });
        mp = () => ({ "mental.spent": 0 });
        break;
      case "fumble":
        // -1 condition
        con = () => -1;
        break;
      case "failure":
        // 2 hp, 2 mp
        hp = actor => ({ "stamina.spent": actor.system.resources.stamina.spent - 2 });
        mp = actor => ({ "mental.spent": actor.system.resources.mental.spent - 2 });
        break;
    }

    const makeUpdate = actor => {
      const stamina = hp(actor);
      const mental = mp(actor);
      const condition = con(actor); // TODO

      return {
        _id: actor.id,
        system: {
          resources: foundry.utils.mergeObject(stamina, mental),
        },
      };
    };

    const updates = members.map(makeUpdate);
    await getDocumentClass("Actor").updateDocuments(updates);
  }
}
