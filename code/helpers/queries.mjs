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
