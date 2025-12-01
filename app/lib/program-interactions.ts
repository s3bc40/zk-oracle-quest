import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "./anchor-client";
import BN from "bn.js";

export async function initializePlayer(wallet: AnchorWallet) {
  try {
    const program = getProgram(wallet);
    const player = wallet.publicKey;

    // Derive PDA for player profile
    const [playerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player.toBuffer()],
      program.programId
    );

    console.log("🚀 Initializing player...");
    console.log("Player:", player.toBase58());
    console.log("Player PDA:", playerProfilePda.toBase58());

    const tx = await program.methods
      .initializePlayer()
      .accounts({
        playerProfile: playerProfilePda,
        signer: player,
      })
      .rpc();

    console.log("✅ Player initialized!");
    console.log("Transaction:", tx);

    return {
      success: true,
      signature: tx,
      message: "Player profile initialized!",
    };
  } catch (error: unknown) {
    console.error("❌ Error:", error);

    if (error instanceof Error && error.message?.includes("already in use")) {
      return {
        success: true,
        message: "Player profile already exists!",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to initialize player",
      error: String(error),
    };
  }
}

export async function placeBet(
  wallet: AnchorWallet,
  eventId: number,
  chosenOutcome: boolean,
  amountSol: number
) {
  try {
    const program = getProgram(wallet);
    const player = wallet.publicKey;
    const amountLamports = new BN(amountSol * 1_000_000_000);

    // Derive PDAs
    const [playerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player.toBuffer()],
      program.programId
    );

    const [betPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        player.toBuffer(),
        new BN(eventId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    console.log("🎲 Placing bet...");
    console.log("Event ID:", eventId);
    console.log("Outcome:", chosenOutcome ? "YES" : "NO");
    console.log("Amount:", amountSol, "SOL");
    console.log("Bet PDA:", betPda.toBase58());

    const tx = await program.methods
      .placeBet(new BN(eventId), chosenOutcome, amountLamports)
      .accounts({
        bet: betPda,
        playerProfile: playerProfilePda,
        signer: player,
      })
      .rpc();

    console.log("✅ Bet placed!");
    console.log("Transaction:", tx);

    return {
      success: true,
      signature: tx,
      message: `Bet placed: ${amountSol} SOL on ${
        chosenOutcome ? "YES" : "NO"
      }`,
    };
  } catch (error: unknown) {
    console.error("❌ Error:", error);

    if (
      error instanceof Error &&
      error.message?.includes("Player profile not initialized")
    ) {
      return {
        success: false,
        message: "Please initialize your player profile first!",
        error: error.toString(),
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to place bet",
      error: String(error),
    };
  }
}
