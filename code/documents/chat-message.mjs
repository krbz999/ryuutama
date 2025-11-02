export default class RyuutamaChatMessage extends foundry.documents.ChatMessage {
  /** @inheritdoc */
  get visible() {
    const system = this.system.visible ?? true;
    return system && super.visible;
  }
}
