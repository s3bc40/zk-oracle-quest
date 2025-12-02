"use client";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useState, useEffect } from "react";
import { initializePlayer } from "@/lib/program-interactions";
import { getProgram } from "@/lib/anchor-client";
import { PublicKey } from "@solana/web3.js";

export default function Home() {
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [playerInitialized, setPlayerInitialized] = useState<boolean | null>(
    null
  );
  const [checking, setChecking] = useState(false);

  // Check player status on wallet connect
  useEffect(() => {
    const checkPlayer = async () => {
      if (!wallet) {
        setPlayerInitialized(null);
        return;
      }

      setChecking(true);
      try {
        const program = getProgram(wallet);
        const [playerProfilePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("player"), wallet.publicKey.toBuffer()],
          program.programId
        );

        await program.account.playerProfile.fetch(playerProfilePda);
        setPlayerInitialized(true);
      } catch (error) {
        setPlayerInitialized(false);
      } finally {
        setChecking(false);
      }
    };

    checkPlayer();
  }, [wallet]);

  const handleInitPlayer = async () => {
    if (!wallet) {
      alert("Please connect wallet first");
      return;
    }

    setLoading(true);
    try {
      const result = await initializePlayer(wallet);
      if (result.success) {
        setPlayerInitialized(true);
        alert("✅ Player profile initialized! You can now enter the game.");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-white text-sm"
            >
              🔐 Admin Panel
            </Link>
          </div>
          <WalletMultiButton />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold mb-4">🎮 ZK Oracle Quest</h1>
          <p className="text-xl text-gray-300">
            Explore the dungeon, discover prediction oracles, place bets
            on-chain!
          </p>

          {/* Player Status Card */}
          {wallet && (
            <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-3">Player Status</h3>
              {checking ? (
                <div className="text-gray-400">Checking profile...</div>
              ) : playerInitialized ? (
                <div className="space-y-2">
                  <div className="text-green-400 text-2xl">✅</div>
                  <p className="text-green-400 font-bold">
                    Profile Initialized
                  </p>
                  <p className="text-sm text-gray-400">Ready to play!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-yellow-400 text-2xl">⚠️</div>
                  <p className="text-yellow-400 font-bold">
                    Profile Not Initialized
                  </p>
                  <p className="text-sm text-gray-400">
                    Initialize to start playing
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">🚶</div>
              <h3 className="text-xl font-bold mb-2">Explore</h3>
              <p className="text-gray-400">Walk around and find oracle NPCs</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-bold mb-2">Predict</h3>
              <p className="text-gray-400">Place bets on real-world events</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Win</h3>
              <p className="text-gray-400">Claim SOL if your prediction wins</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {wallet && !playerInitialized && !checking && (
              <button
                onClick={handleInitPlayer}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 py-3 px-8 rounded-lg text-lg font-bold disabled:opacity-50 mb-4"
              >
                {loading ? "Initializing..." : "⚡ Initialize Player Profile"}
              </button>
            )}

            <Link href="/game">
              <button
                className={`py-4 px-12 rounded-lg text-xl font-bold block mx-auto ${
                  playerInitialized
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-gray-600 cursor-not-allowed opacity-50"
                }`}
                disabled={!playerInitialized}
              >
                {playerInitialized
                  ? "Enter the Quest 🎮"
                  : "🔒 Initialize Profile First"}
              </button>
            </Link>

            {!wallet && (
              <p className="text-sm text-gray-400">
                Connect your wallet above to get started
              </p>
            )}
          </div>

          {/* Tech Stack */}
          <div className="mt-16 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-500 mb-2">Built with</p>
            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <span>⚡ Solana</span>
              <span>•</span>
              <span>🎮 Phaser 3</span>
              <span>•</span>
              <span>⚓ Anchor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
