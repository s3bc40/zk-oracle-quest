import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "./anchor-client";
import BN from "bn.js";

export async function initializePlayer(wallet: AnchorWallet) {
  try {
    const program = getProgram(wallet);

    const [playerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initializePlayer()
      .accounts({
        playerProfile: playerProfilePda,
        signer: wallet.publicKey,
      })
      .rpc();

    return {
      success: true,
      signature: tx,
      message: "Player profile initialized successfully!",
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("already in use")) {
      return {
        success: true,
        message: "Player profile already initialized!",
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

export async function checkExistingBet(
  wallet: AnchorWallet,
  eventId: number
): Promise<boolean> {
  try {
    const program = getProgram(wallet);

    const [betPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        wallet.publicKey.toBuffer(),
        new BN(eventId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.account.bet.fetch(betPda);
    return true;
  } catch {
    return false;
  }
}

export async function placeBet(
  wallet: AnchorWallet,
  eventId: number,
  outcome: boolean,
  amount: number
) {
  try {
    const program = getProgram(wallet);
    const amountLamports = new BN(amount * 1e9);

    const betExists = await checkExistingBet(wallet, eventId);
    if (betExists) {
      return {
        success: false,
        message: "You have already placed a bet on this event!",
      };
    }

    const [betPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        wallet.publicKey.toBuffer(),
        new BN(eventId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [playerProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), new BN(eventId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .placeBet(new BN(eventId), outcome, amountLamports)
      .accounts({
        bet: betPda,
        playerProfile: playerProfilePda,
        oracleEvent: eventPda,
        signer: wallet.publicKey,
      })
      .rpc();

    return {
      success: true,
      signature: tx,
      message: `Bet placed successfully! ${amount} SOL on ${
        outcome ? "YES" : "NO"
      }`,
    };
  } catch (error: unknown) {
    console.error("Place bet error:", error);

    if (error instanceof Error && error.message?.includes("already in use")) {
      return {
        success: false,
        message: "You have already placed a bet on this event!",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to place bet",
      error: String(error),
    };
  }
}

export async function getUserBet(wallet: AnchorWallet, eventId: number) {
  try {
    const program = getProgram(wallet);

    const [betPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        wallet.publicKey.toBuffer(),
        new BN(eventId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const bet = await program.account.bet.fetch(betPda);
    return {
      exists: true,
      outcome: bet.chosenOutcome,
      amount: bet.amount.toNumber() / 1e9,
      claimed: bet.claimed,
      pubkey: betPda,
    };
  } catch {
    return { exists: false };
  }
}

export async function createEvent(
  wallet: AnchorWallet,
  eventId: number,
  description: string
) {
  try {
    const program = getProgram(wallet);

    const [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), new BN(eventId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createOracleEvent(new BN(eventId), description)
      .accounts({
        oracleEvent: eventPda,
        signer: wallet.publicKey,
      })
      .rpc();

    return {
      success: true,
      signature: tx,
      message: `Event #${eventId} created successfully!`,
    };
  } catch (error: unknown) {
    console.error("Create event error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create event",
      error: String(error),
    };
  }
}

export async function resolveEvent(
  wallet: AnchorWallet,
  eventId: number,
  outcome: boolean
) {
  try {
    const program = getProgram(wallet);

    const [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), new BN(eventId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .resolveEvent(outcome)
      .accounts({
        oracleEvent: eventPda,
        signer: wallet.publicKey,
      })
      .rpc();

    return {
      success: true,
      signature: tx,
      message: `Event #${eventId} resolved to ${outcome ? "YES" : "NO"}!`,
    };
  } catch (error: unknown) {
    console.error("Resolve event error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to resolve event",
      error: String(error),
    };
  }
}

export async function getAllBets(wallet: AnchorWallet) {
  try {
    const program = getProgram(wallet);
    const allBets = await program.account.bet.all();

    return allBets.map((bet) => ({
      pubkey: bet.publicKey,
      player: bet.account.player,
      eventId: bet.account.eventId.toNumber(),
      outcome: bet.account.chosenOutcome,
      amount: bet.account.amount.toNumber() / 1e9,
      claimed: bet.account.claimed,
    }));
  } catch (error) {
    console.error("Error fetching all bets:", error);
    return [];
  }
}

export async function closeBet(wallet: AnchorWallet, betPubkey: PublicKey) {
  try {
    const program = getProgram(wallet);

    const tx = await program.methods
      .closeBet()
      .accounts({
        bet: betPubkey,
        signer: wallet.publicKey,
      })
      .rpc();

    return {
      success: true,
      signature: tx,
      message: "Bet closed successfully! Rent refunded.",
    };
  } catch (error: unknown) {
    console.error("Close bet error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to close bet",
      error: String(error),
    };
  }
}
