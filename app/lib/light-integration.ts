/**
 * NOTE: Light Integration is currently disabled pending updates to Light Protocol.
 * The code below is retained for future reference.
 */

// import { AnchorWallet } from "@solana/wallet-adapter-react";
// import { Connection, PublicKey } from "@solana/web3.js";
// import { getProgram, PROGRAM_ID } from "./anchor-client";
// import { Rpc, createRpc } from "@lightprotocol/stateless.js";
// import BN from "bn.js";

// // Official Light Protocol Devnet Endpoints
// const DEVNET_RPC = "https://api.devnet.solana.com";
// const LIGHT_RPC =
//   "https://devnet.helius-rpc.com?api-key=" + process.env.HELIUS_API_KEY;

// // Devnet State Trees (from Light Protocol docs)
// const STATE_MERKLE_TREE_1 = new PublicKey(
//   "CwSZ17woioMpbBbUyLNHqr8cBKTFGKz5AY28EuNq7PKN"
// );
// const STATE_MERKLE_TREE_2 = new PublicKey(
//   "7Gm4TF4GVSZw1yZcYaGpLUwcWwLyEoS2EKcJHQJJcK2K"
// );
// const NULLIFIER_QUEUE_1 = new PublicKey(
//   "5To6Q2KP6cSiGqF4CZVMYXo5KdU3wDJdiHFA4WXeJz8f"
// );
// const ADDRESS_MERKLE_TREE_1 = new PublicKey(
//   "2hYJLvFeKx2pzJz5VxzSyaJmNZG4EnMZfPkPQQbLfZFo"
// );

// // Light System Program
// const LIGHT_SYSTEM_PROGRAM = new PublicKey(
//   "H5sFv8VwWmjxHYS2GB4fTDsK7uTtnRT4WiixtHrET3bN"
// );
// const ACCOUNT_COMPRESSION_PROGRAM = new PublicKey(
//   "CbjvJc1SNx1aav8tU49dJGHu8EUdzQJSMtkjDmV8miqK"
// );

// // Initialize Light RPC
// export async function initLightRpc(): Promise<Rpc> {
//   return await createRpc(DEVNET_RPC, LIGHT_RPC);
// }

// // Initialize Player Profile
// export async function initializePlayerOnChain(wallet: AnchorWallet) {
//   try {
//     console.log("🚀 Initializing player profile...");
//     console.log("Player:", wallet.publicKey.toBase58());
//     console.log("Program:", PROGRAM_ID.toBase58());

//     const rpc = await initLightRpc();
//     const program = getProgram(wallet);

//     // Get latest compressed account state
//     const latestNonEmptySlot = await rpc.getIndexerSlot();
//     console.log("Latest slot:", latestNonEmptySlot);

//     // Prepare accounts for Light Protocol
//     const remainingAccounts = [
//       { pubkey: LIGHT_SYSTEM_PROGRAM, isSigner: false, isWritable: false },
//       {
//         pubkey: ACCOUNT_COMPRESSION_PROGRAM,
//         isSigner: false,
//         isWritable: false,
//       },
//       { pubkey: STATE_MERKLE_TREE_1, isSigner: false, isWritable: true },
//       { pubkey: NULLIFIER_QUEUE_1, isSigner: false, isWritable: true },
//       { pubkey: ADDRESS_MERKLE_TREE_1, isSigner: false, isWritable: true },
//     ];

//     // Call initialize_player instruction
//     const tx = await program.methods
//       .initializePlayer(
//         // ValidityProof - placeholder for now
//         {
//           a: [0, 0],
//           b: [
//             [0, 0],
//             [0, 0],
//           ],
//           c: [0, 0],
//         },
//         // PackedAddressTreeInfo
//         {
//           treeIndex: 0,
//           addressQueueIndex: 0,
//           addressMerkleTreeIndex: 0,
//           addressMerkleTreeRootIndex: 0,
//         },
//         // output_tree_index
//         0
//       )
//       .accounts({
//         player: wallet.publicKey,
//       })
//       .remainingAccounts(remainingAccounts)
//       .rpc();

//     console.log("✅ Transaction successful!");
//     console.log("Signature:", tx);

//     return {
//       success: true,
//       signature: tx,
//       message: "Player profile initialized!",
//     };
//   } catch (error: unknown) {
//     console.error("❌ Error:", error);

//     // Check for common errors
//     if (error instanceof Error && error.message?.includes("already in use")) {
//       return {
//         success: true,
//         message: "Player profile already exists!",
//       };
//     }

//     if (
//       error instanceof Error &&
//       error.message?.includes("InvalidAccountData")
//     ) {
//       return {
//         success: false,
//         message: "Invalid proof data. Light Protocol proof generation needed.",
//       };
//     }

//     return {
//       success: false,
//       message:
//         error instanceof Error ? error.message : "Failed to initialize player",
//       error: String(error),
//     };
//   }
// }

// // Place Private Bet
// export async function placeBetOnChain(
//   wallet: AnchorWallet,
//   eventId: number,
//   chosenOutcome: boolean,
//   amountSol: number
// ) {
//   try {
//     console.log("🎲 Placing bet...");
//     console.log("Event ID:", eventId);
//     console.log("Outcome:", chosenOutcome ? "YES" : "NO");
//     console.log("Amount:", amountSol, "SOL");

//     const rpc = await initLightRpc();
//     const program = getProgram(wallet);

//     const amountLamports = new BN(amountSol * 1_000_000_000);

//     const remainingAccounts = [
//       { pubkey: LIGHT_SYSTEM_PROGRAM, isSigner: false, isWritable: false },
//       {
//         pubkey: ACCOUNT_COMPRESSION_PROGRAM,
//         isSigner: false,
//         isWritable: false,
//       },
//       { pubkey: STATE_MERKLE_TREE_1, isSigner: false, isWritable: true },
//       { pubkey: NULLIFIER_QUEUE_1, isSigner: false, isWritable: true },
//       { pubkey: ADDRESS_MERKLE_TREE_1, isSigner: false, isWritable: true },
//     ];

//     const tx = await program.methods
//       .placePrivateBet(
//         new BN(eventId),
//         chosenOutcome,
//         amountLamports,
//         {
//           a: [0, 0],
//           b: [
//             [0, 0],
//             [0, 0],
//           ],
//           c: [0, 0],
//         },
//         {
//           treeIndex: 0,
//           addressQueueIndex: 0,
//           addressMerkleTreeIndex: 0,
//           addressMerkleTreeRootIndex: 0,
//         },
//         0
//       )
//       .accounts({
//         player: wallet.publicKey,
//       })
//       .remainingAccounts(remainingAccounts)
//       .rpc();

//     console.log("✅ Bet placed!");
//     console.log("Signature:", tx);

//     return {
//       success: true,
//       signature: tx,
//       message: `Bet placed: ${amountSol} SOL on ${
//         chosenOutcome ? "YES" : "NO"
//       }`,
//     };
//   } catch (error: unknown) {
//     console.error("❌ Error placing bet:", error);
//     return {
//       success: false,
//       message: error instanceof Error ? error.message : "Failed to place bet",
//       error: String(error),
//     };
//   }
// }
