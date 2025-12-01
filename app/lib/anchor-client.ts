import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/zk_oracle_quest.json";

const PROGRAM_ID = new PublicKey(
  "B6qG7jPjiTcdnNS1Rttf5We5H4GbyN3dUqu8VKMFv5Eh"
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
