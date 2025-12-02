import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { OracleEvent } from "@/lib/mock-data";

interface OracleSprite extends Phaser.Physics.Arcade.Sprite {
  eventData?: OracleEvent;
}

export class MainGame extends Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private oracles!: Phaser.Physics.Arcade.StaticGroup;
  private nearbyOracle: OracleSprite | null = null;

  constructor() {
    super("MainGame");
  }

  create() {
    // Create player (blue square)
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x0000ff, 1);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.generateTexture("player", 32, 32);
    playerGraphics.destroy();

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);

    // Create oracles (purple circles)
    const oracleGraphics = this.add.graphics();
    oracleGraphics.fillStyle(0x9b59b6, 1);
    oracleGraphics.fillCircle(16, 16, 16);
    oracleGraphics.generateTexture("oracle", 32, 32);
    oracleGraphics.destroy();

    this.oracles = this.physics.add.staticGroup();

    // Oracle events data
    const oracleEvents: OracleEvent[] = [
      {
        id: 1,
        description: "Will BTC hit $100k by 2025?",
        category: "crypto",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalBets: 0,
        yesVotes: 0,
        noVotes: 0,
        resolved: false,
        outcome: undefined,
      },
      {
        id: 2,
        description: "Will SOL reach $500?",
        category: "crypto",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalBets: 0,
        yesVotes: 0,
        noVotes: 0,
        resolved: false,
        outcome: undefined,
      },
      {
        id: 3,
        description: "Will ETH flip BTC?",
        category: "crypto",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalBets: 0,
        yesVotes: 0,
        noVotes: 0,
        resolved: false,
        outcome: undefined,
      },
    ];

    const positions = [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      { x: 400, y: 450 },
    ];

    oracleEvents.forEach((event, index) => {
      const pos = positions[index];
      const oracle = this.oracles.create(
        pos.x,
        pos.y,
        "oracle"
      ) as OracleSprite;
      oracle.eventData = event;

      this.add.text(pos.x - 40, pos.y - 50, `Oracle ${event.id}`, {
        fontSize: "12px",
        color: "#fff",
      });
    });

    // Keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // SPACE to interact
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.nearbyOracle?.eventData) {
        EventBus.emit("oracle-interact", this.nearbyOracle.eventData);
      }
    });

    // Instructions
    this.add.text(10, 10, "Arrow Keys: Move | SPACE: Interact with Oracle", {
      fontSize: "14px",
      color: "#fff",
      backgroundColor: "#000",
      padding: { x: 10, y: 5 },
    });

    // Notify React that scene is ready
    EventBus.emit("current-scene-ready", this);
  }

  update() {
    // Player movement
    const speed = 160;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }

    // Check proximity to oracles
    this.nearbyOracle = null;
    this.oracles.children.entries.forEach((oracle) => {
      const oracleSprite = oracle as OracleSprite;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        oracleSprite.x,
        oracleSprite.y
      );

      if (distance < 50) {
        this.nearbyOracle = oracleSprite;
      }
    });
  }
}
