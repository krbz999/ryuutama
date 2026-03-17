/**
 * @import { ActiveEffectChangeHandler, ActiveEffectChangeRenderer } from "@client/documents/_types.mjs";
 * @import { ActiveEffectChangeTypeConfig } from "@client/config.mjs";
 */

/** @type {ActiveEffectChangeHandler} */
const handler = async (targetDoc, change, { field, replacementData, modifyTarget, ...options } = {}) => {
  console.warn({ targetDoc, change, field, replacementData, modifyTarget, options });
  // return {};
};

/** @type {ActiveEffectChangeRenderer} */
const render = async ({ change, index, fields, defaultPriority, ...context }) => {
  console.warn({ change, index, fields, defaultPriority, context });
  const li = document.createElement("LI");

  const options = Object.entries(context.changeTypes)
    .map(([value, label]) => ({
      value, label,
      priority:
        CONST.ACTIVE_EFFECT_CHANGE_TYPES[value]
        ?? CONFIG.ActiveEffect.changeTypes[value].defaultPriority
        ?? null,
    }))
    .sort((a, b) => a.priority - b.priority);

  li.dataset.index = index;
  li.innerHTML = `
    <div class="key">${fields.key.toInput({ name: change.keyPath, value: change.key }).outerHTML}</div>
    <div class="type">${
      fields.type.toInput({ name: change.typePath, value: change.type, options }).outerHTML
    }</div>
    <div class="value">${fields.value.toInput({ name: change.valuePath, value: change.value }).outerHTML}</div>
    <div class="priority">${
      fields.priority.toInput({ name: change.priorityPath, value: change.priority, placeholder: defaultPriority }).outerHTML
    }</div>
    <div class="controls">
      <button type="button" class="inline-control icon fa-solid fa-trash" data-action="deleteChange"></button>
    </div>
    `;

  return li.outerHTML;
};

/** @type {ActiveEffectChangeTypeConfig} */
export default {
  handler, render,
  label: "RYUUTAMA.ACTIVE_EFFECT.CHANGE_TYPES.check",
  defaultPriority: 100,
};
