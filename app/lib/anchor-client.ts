import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/simple_oracle_quest.json";

const PROGRAM_ID = new PublicKey(
  "9tSP8kXEUif9doAPhAbUKZm3qKNphpcHGKc35jLr1xEA"
);
const DEVNET_RPC = "https://api.devnet.solana.com";

export function getProgram(wallet: AnchorWallet) {
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(idl, provider);
}

export { PROGRAM_ID };
