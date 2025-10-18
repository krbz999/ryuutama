export default class RyuutamaToken extends foundry.canvas.placeables.Token {
  /** @override */
  _drawBar(number, bar, data) {
    const val = Number(data.value);
    const pct = Math.clamp(val, 0, data.max) / data.max;

    // Determine sizing
    const { width, height } = this.document.getSize();
    const s = canvas.dimensions.uiScale;
    const bw = width;
    const bh = 8 * (this.document.height >= 2 ? 1.5 : 1) * s;

    // Determine the color to use
    let color;
    const Color = foundry.utils.Color;
    if (number === 0) color = Color.from(Color.mix(Color.from("#b8006d"), Color.from("#4BA72F"), pct));
    else color = Color.from(Color.mix(Color.from("#270695"), Color.from("#4F2EBD"), pct));

    // Draw the bar
    bar.clear();
    bar.lineStyle(s, 0x000000, 1.0);
    bar.beginFill(0x000000, 0.5).drawRoundedRect(0, 0, bw, bh, 3 * s);
    bar.beginFill(color, 1.0).drawRoundedRect(0, 0, pct * bw, bh, 2 * s);

    // Set position
    const posY = number === 0 ? height - bh : 0;
    bar.position.set(0, posY);
    return true;
  }
}
