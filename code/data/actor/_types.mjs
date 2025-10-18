/**
 * @typedef CheckRollConfig
 * @property {string[]} [abilities]
 * @property {string} [formula]                             An explicit formula can be provided, in which case
 *                                                          abilities are ignored for the formula creation. Modifiers
 *                                                          are still added on top.
 * @property {string} [type]
 * @property {"travel"|"direction"|"camping"} [journeyId]   If a journey check, the type of check.
 * @property {number} [modifier]                            A modifier to the roll that cannot be changed via the UI,
 *                                                          e.g., the accuracy or damage modifier from a weapon.
 * @property {number} [situationalBonus]
 * @property {object} [critical]
 * @property {boolean} [critical.allowed]                   Can the roll be critical?
 * @property {boolean} [critical.isCritical]                Roll double the dice?
 * @property {object} [concentration]
 * @property {boolean} [concentration.allowed]              If explicitly `false`, options are not shown.
 * @property {boolean} [concentration.consumeMental]        Consume half the traveler's current MP (rounded up)?
 * @property {boolean} [concentration.consumeFumble]        Consume a Fumble point?
 * @property {object} [condition]
 * @property {boolean} [condition.updateScore]              Update the traveler's condition score with
 *                                                          the total of the check?
 * @property {boolean} [condition.removeStatuses]           Remove status effects whose strength is lower than the
 *                                                          traveler's condition score?
 * @property {object} [accuracy]
 * @property {boolean} [accuracy.weapon]                    The weapon being used for the check.
 * @property {boolean} [accuracy.consumeStamina]            Consume HP due to using a non-Mastered weapon?
 * @property {object} [initiative]
 * @property {boolean} [initiative.shield]                  If the rolled initiative value is lower than the actor's
 *                                                          Shield Dodge Value, create the Shield Dodge effect?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckDialogConfig
 * @property {boolean} [configure]    Should a configuration dialog be created?
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckMessageConfig
 * @property {boolean} [create]   Should a chat message be created?
 * @property {object} [data]      Data to be used for the chat message. This does not include `rolls` or `content`.
 */
