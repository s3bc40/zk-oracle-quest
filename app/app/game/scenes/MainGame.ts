import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { OracleEvent } from "@/lib/mock-data";

interface OracleSprite extends Phaser.Physics.Arcade.Sprite {
  eventData?: OracleEvent;
}

export class MainGame extends Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerEmoji!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private oracles!: Phaser.Physics.Arcade.StaticGroup;
  private oracleEmojis: Phaser.GameObjects.Text[] = [];
  private nearbyOracle: OracleSprite | null = null;
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super("MainGame");
  }

  create() {
    // Create darker dungeon background with stone texture
    const bg = this.add.graphics();
    bg.fillStyle(0x0f0f1e, 1);
    bg.fillRect(0, 0, 800, 600);

    // Add dungeon floor tiles with variation
    for (let i = 0; i < 800; i += 32) {
      for (let j = 0; j < 600; j += 32) {
        const darkness = Math.random() * 0.3;
        const color = Phaser.Display.Color.GetColor(
          20 - darkness * 20,
          20 - darkness * 20,
          30 - darkness * 30
        );

        this.add.rectangle(i + 16, j + 16, 30, 30, color, 1);

        // Add some "cracks" randomly
        if (Math.random() > 0.9) {
          this.add
            .rectangle(i + 16, j + 16, 28, 2, 0x000000, 0.5)
            .setRotation(Math.random() * Math.PI);
        }
      }
    }

    // Add dungeon walls
    const wallThickness = 40;
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x0a0a15, 1);

    // Top wall
    wallGraphics.fillRect(0, 0, 800, wallThickness);
    // Bottom wall
    wallGraphics.fillRect(0, 600 - wallThickness, 800, wallThickness);
    // Left wall
    wallGraphics.fillRect(0, 0, wallThickness, 600);
    // Right wall
    wallGraphics.fillRect(800 - wallThickness, 0, wallThickness, 600);

    // Add torch lights in corners
    const torches = [
      { x: 100, y: 100 },
      { x: 700, y: 100 },
      { x: 100, y: 500 },
      { x: 700, y: 500 },
    ];

    torches.forEach((pos) => {
      // Torch emoji
      this.add
        .text(pos.x, pos.y, "🔥", {
          fontSize: "24px",
        })
        .setOrigin(0.5);

      // Flickering light effect
      const light = this.add.circle(pos.x, pos.y, 80, 0xff6600, 0.1);

      this.tweens.add({
        targets: light,
        alpha: 0.15,
        scale: 1.1,
        duration: 500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Add some dungeon decorations
    const decorations = [
      { x: 150, y: 300, emoji: "🪨" },
      { x: 650, y: 350, emoji: "🪨" },
      { x: 400, y: 150, emoji: "💀" },
    ];

    decorations.forEach((deco) => {
      this.add
        .text(deco.x, deco.y, deco.emoji, {
          fontSize: "20px",
        })
        .setOrigin(0.5)
        .setAlpha(0.7);
    });

    // Create player sprite (invisible, we'll use emoji overlay)
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x0000ff, 0);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.generateTexture("player", 32, 32);
    playerGraphics.destroy();

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);

    // Add emoji on top of player sprite
    this.playerEmoji = this.add.text(400, 300, "🧙", {
      fontSize: "32px",
    });
    this.playerEmoji.setOrigin(0.5);

    // Create oracle sprites (invisible, we'll use emoji overlay)
    const oracleGraphics = this.add.graphics();
    oracleGraphics.fillStyle(0x9b59b6, 0);
    oracleGraphics.fillRect(0, 0, 32, 32);
    oracleGraphics.generateTexture("oracle", 32, 32);
    oracleGraphics.destroy();

    this.oracles = this.physics.add.staticGroup();

    // Show loading message
    this.loadingText = this.add
      .text(400, 300, "Loading oracle events...", {
        fontSize: "20px",
        color: "#fff",
        backgroundColor: "#000000aa",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    // Keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();

    // SPACE to interact
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.nearbyOracle?.eventData) {
        EventBus.emit("oracle-interact", this.nearbyOracle.eventData);
      }
    });

    // Instructions with better styling
    this.add.rectangle(400, 30, 500, 50, 0x000000, 0.7);
    this.add
      .text(400, 30, "⌨️ Arrow Keys: Move | SPACE: Interact with Oracle", {
        fontSize: "14px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Request events from React
    EventBus.emit("request-events");

    // Listen for events data
    EventBus.once("events-loaded", (events: OracleEvent[]) => {
      this.loadEvents(events);
    });

    // Notify React that scene is ready
    EventBus.emit("current-scene-ready", this);
  }

  loadEvents(oracleEvents: OracleEvent[]) {
    // Remove loading text
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = undefined;
    }

    if (oracleEvents.length === 0) {
      this.add
        .text(
          400,
          300,
          "No oracle events found.\nVisit /admin to create some!",
          {
            fontSize: "18px",
            color: "#fff",
            backgroundColor: "#000000aa",
            padding: { x: 16, y: 8 },
            align: "center",
          }
        )
        .setOrigin(0.5);
      return;
    }

    // Position oracles in a grid or specific positions
    const positions = this.generateOraclePositions(oracleEvents.length);

    oracleEvents.forEach((event, index) => {
      const pos = positions[index];
      const oracle = this.oracles.create(
        pos.x,
        pos.y,
        "oracle"
      ) as OracleSprite;
      oracle.eventData = event;

      // Add crystal ball emoji
      const oracleEmoji = this.add.text(pos.x, pos.y, "🔮", {
        fontSize: "40px",
      });
      oracleEmoji.setOrigin(0.5);
      this.oracleEmojis.push(oracleEmoji);

      // Add glow effect
      const glowColor = event.resolved ? 0x666666 : 0x9b59b6;
      const glow = this.add.circle(pos.x, pos.y, 25, glowColor, 0.2);

      // Add pulsing animation (slower if resolved)
      if (!event.resolved) {
        this.tweens.add({
          targets: glow,
          alpha: 0.5,
          scale: 1.2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      }

      // Label with status
      const labelText = event.resolved
        ? `Oracle ${event.id} [RESOLVED]`
        : `Oracle ${event.id}`;

      this.add
        .text(pos.x, pos.y - 50, labelText, {
          fontSize: "14px",
          color: event.resolved ? "#888" : "#fff",
          backgroundColor: "#000000aa",
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5);
    });
  }

  generateOraclePositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const padding = 80;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const xSpacing = (800 - 2 * padding) / (cols + 1);
    const ySpacing = (600 - 2 * padding) / (rows + 1);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: padding + (col + 1) * xSpacing,
        y: padding + (row + 1) * ySpacing,
      });
    }

    return positions;
  }

  update() {
    // Update player emoji position
    if (this.playerEmoji) {
      this.playerEmoji.setPosition(this.player.x, this.player.y);
    }

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

      // Safety check
      if (!oracleSprite || !oracleSprite.x || !oracleSprite.y) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        oracleSprite.x,
        oracleSprite.y
      );

      if (distance < 60) {
        this.nearbyOracle = oracleSprite;
      }
    });
  }
}
