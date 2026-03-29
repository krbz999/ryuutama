/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../../data/actor/_types.mjs";
 */

/**
 * @typedef _CheckConfigurationDialogConfiguration
 * @property {CheckRollConfig} rollConfig
 * @property {CheckDialogConfig} dialogConfig
 * @property {CheckMessageConfig} messageConfig
 * @property {RyuutamaActor} document
 * @property {string} [parentWindow]    Id of the parent window to attach this application to.
 */

/**
 * @typedef {ApplicationConfiguration & _CheckConfigurationDialogConfiguration} CheckConfigurationDialogConfiguration
 */

/**
 * @typedef PlaceMembersDialogConfiguration
 * @property {string[]} members             Actor ids of party members to place.
 * @property {boolean} [selectArea=true]    Place tokens in an area instead of manual.
 * @property {boolean} [createCombatants]   Create combatants (and a Combat if missing) for placed tokens.
 */
