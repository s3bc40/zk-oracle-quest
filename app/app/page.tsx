"use client";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { initializePlayer } from "../lib/program-interactions";
import Link from "next/link";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInitializePlayer = async () => {
    if (!wallet) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await initializePlayer(wallet);
      setMessage(result.message);
    } catch (error) {
      setMessage("Error initializing player");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🎮 ZK Oracle Quest</h1>
          <WalletMultiButton />
        </div>

        {/* Main Content */}
        <div className="text-center py-20">
          {connected ? (
            <div>
              <h2 className="text-2xl mb-4">Welcome, Player! 🎉</h2>
              <p className="text-gray-400 mb-8">
                Wallet: {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-8)}
              </p>

              {/* Message Display */}
              {message && (
                <div className="mb-4 p-4 bg-blue-900 rounded-lg">
                  <p>{message}</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleInitializePlayer}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Initialize Profile"}
                </button>
                <Link href="/events">
                  <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold ml-4">
                    View Events
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl mb-4">
                Connect Your Wallet to Start Playing
              </h2>
              <p className="text-gray-400 mb-8">
                Place private bets on oracle events using ZK Compression
              </p>
              <div className="text-left max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">How to Play:</h3>
                <ol className="space-y-2 text-gray-300">
                  <li>1. Connect your Solana wallet (Phantom/Solflare)</li>
                  <li>2. Initialize your player profile</li>
                  <li>3. Browse oracle events</li>
                  <li>4. Place private bets on outcomes</li>
                  <li>5. Claim winnings when events resolve!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 py-4">
          <div className="container mx-auto px-4 flex justify-around text-sm">
            <div>
              <p className="text-gray-400">Network</p>
              <p className="font-semibold">Devnet</p>
            </div>
            <div>
              <p className="text-gray-400">Program ID</p>
              <p className="font-mono text-xs">B6qG...v5Eh</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="text-green-400">● Live</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
