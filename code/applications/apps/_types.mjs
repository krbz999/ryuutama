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
 */

/**
 * @typedef {ApplicationConfiguration & _CheckConfigurationDialogConfiguration} CheckConfigurationDialogConfiguration
 */
