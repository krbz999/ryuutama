export default class BaseDie extends foundry.dice.terms.Die {
  constructor({ modifiers = [], number = 1, ...rest }) {
    const alter = modifiers.findSplice(m => /m(\d+)?/.test(m));

    const match = alter?.match(/m(\d+)?/i) ?? [];
    const multiplier = parseInt(match[1] ?? 1);
    number *= multiplier;

    super({ modifiers, number, ...rest });
  }
}
