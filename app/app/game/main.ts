import { AUTO, Game } from "phaser";
import { Boot } from "./scenes/Boot";
import { MainGame } from "./scenes/MainGame";

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#2d2d2d",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Boot, MainGame],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
