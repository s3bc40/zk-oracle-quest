import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleOracleQuest } from "../target/types/simple_oracle_quest";
import { expect } from "chai";

describe("simple-oracle-quest", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SimpleOracleQuest as Program<SimpleOracleQuest>;

  it("Initialize player profile", async () => {
    const player = provider.wallet.publicKey;

    const [playerProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), player.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .initializePlayer()
        .accounts({
          playerProfile: playerProfilePda,
          signer: player,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Player initialized:", tx);

      const playerAccount = await program.account.playerProfile.fetch(
        playerProfilePda
      );
      expect(playerAccount.owner.toString()).to.equal(player.toString());
      expect(playerAccount.totalBets.toNumber()).to.equal(0);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});
