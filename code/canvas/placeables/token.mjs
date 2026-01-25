export default class RyuutamaToken extends foundry.canvas.placeables.Token {
  /**
   * Colors of HP and MP.
   * @type {Record<string, string>}
   */
  static RYUUTAMA_COLORS = {
    hp: "#4ba72f",
    mp: "#4f2ebd",
  };

  /* -------------------------------------------------- */

  /** @override */
  _drawBar(number, bar, data) {
    const pct = this.#getBarPercentage(data);
    const { width, height } = this.document.getSize();
    const s = canvas.dimensions.uiScale;
    const bw = width;
    const bh = 8 * (this.document.height >= 2 ? 1.5 : 1) * s;
    const color = this.#getBarColor(number, data, pct);
    const inverted = this.#getBarInverted(data);

    // Draw the bar.
    bar.clear();
    bar.lineStyle(s, 0x000000, 1.0);
    bar.beginFill(0x000000, 0.5).drawRoundedRect(0, 0, bw, bh, 3 * s);
    bar.beginFill(color, 1.0).drawRoundedRect(0, 0, pct * bw, bh, 2 * s);

    // Set position.
    bar.scale.x = inverted ? -1 : 1;
    const posY = number === 0 ? height - bh : 0;
    bar.position.set(inverted ? bw : 0, posY);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Is the bar inverted?
   * @param {{ attribute: string, value: number, max: number }} data
   * @return {boolean}
   */
  #getBarInverted(data) {
    switch (data.attribute) {
      case "resources.stamina": return this.actor.system.resources.stamina.value < 0;
      default: return false;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Get the fill percentage of a bar.
   * @param {{ attribute: string, value: number, max: number }} data
   * @returns {number}    The percentage, a number between 0 and 1.
   */
  #getBarPercentage(data) {
    switch (data.attribute) {
      case "resources.stamina":
        return this.actor.system.resources.stamina.pct / 100;
      case "resources.mental":
        return this.actor.system.resources.mental.pct / 100;
      default:
        return Math.clamp(data.value, 0, data.max) / data.max;
    }
  }

  /* -------------------------------------------------- */

  /**
   * Get the color of an attribute bar.
   * @param {0|1} number                                                The bar number.
   * @param {{ attribute: string, value: number, max: number }} data    Bar data.
   * @param {number} pct                                                Fill percentage.
   * @returns {foundry.utils.Color}
   */
  #getBarColor(number, data, pct) {
    const Color = foundry.utils.Color;
    let colors;
    switch (data.attribute) {
      case "resources.stamina":
        colors = data.value >= 0 ? ["#b8006d", RyuutamaToken.RYUUTAMA_COLORS.hp] : ["#b8006d", "#ff0000"];
        break;
      case "resources.mental":
        colors = ["#270695", RyuutamaToken.RYUUTAMA_COLORS.mp];
        break;
      default: {
        switch (number) {
          case 0: colors = ["#b8006d", RyuutamaToken.RYUUTAMA_COLORS.hp]; break;
          case 1: colors = ["#270695", RyuutamaToken.RYUUTAMA_COLORS.mp]; break;
        }
      }
    }
    return Color.from(Color.mix(...colors.map(c => Color.from(c)), Math.abs(pct)));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _updateTarget(targeted, user) {
    super._updateTarget(targeted, user);

    if (!targeted) return;
    this.ring?.flashColor(user.color);
  }
}
