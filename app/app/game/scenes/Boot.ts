import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Load assets here if needed
  }

  create() {
    this.scene.start("MainGame");
  }
}
