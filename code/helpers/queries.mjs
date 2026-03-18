/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../data/actor/_types.mjs";
 */

/**
 * Assign queries to the config object.
 */
export default function registerQueries() {
  CONFIG.queries[ryuutama.id] = function({ type, ...queryOptions }) {
    switch (type) {
      case "check": return handleCheckQuery(queryOptions);
      case "handleJourneyManagement": return handleJourneyManagement(queryOptions);
    }
    throw new Error(`${ryuutama.id} | The '${type}' type is not a registered query type.`);
  };
}

/* -------------------------------------------------- */

/**
 * Handle the request for an actor to perform a check.
 * @param {object} queryData
 * @param {string} queryData.actorUuid    The uuid of the actor to perform the check.
 * @param {object} queryData.configs
 * @param {CheckRollConfig} queryData.configs.roll
 * @param {CheckDialogConfig} [queryData.configs.dialog]
 * @param {CheckMessageConfig} [queryData.configs.message]
 * @returns {Promise<number>}
 */
function handleCheckQuery({ actorUuid, configs: { roll, dialog, message } }) {
  message = foundry.utils.mergeObject(message ?? {}, { returnNumeric: true }, { inplace: false });
  return fromUuidSync(actorUuid).system.rollCheck(roll, dialog, message);
}

/* -------------------------------------------------- */

/**
 * Handle assignment of an actor to a task, or other modification to the JourneyManagementData.
 * @param {object} queryData
 * @param {object} queryData.change   The change to perform to the journey configuration.
 * @param {string} party              The uuid of the party to be updated.
 * @returns {Promise<boolean>}        A promise that resolves to whether the adjustments were made.
 */
async function handleJourneyManagement({ change, party }) {
  if (!game.user.isActiveGM) throw new Error("Only the active GM can perform this task.");
  party = fromUuidSync(party);
  if (!party || !(party instanceof foundry.documents.Actor) || (party.type !== "party")) {
    throw new Error("The targeted actor is not of type 'actor'.");
  }
  const result = await party.update(change);
  return !!result;
}
