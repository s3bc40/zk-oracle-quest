"use client";

import { useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/anchor-client";
import { PublicKey } from "@solana/web3.js";

interface PlayerBet {
  eventId: number;
  eventDescription: string;
  outcome: boolean;
  amount: number;
  resolved: boolean;
  eventOutcome?: boolean;
  won?: boolean;
}

export default function QuestLog() {
  const wallet = useAnchorWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [bets, setBets] = useState<PlayerBet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayerBets = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const program = getProgram(wallet);

      console.log("Fetching all bets...");

      // Fetch ALL bets
      const allBets = await program.account.bet.all();
      console.log("Total bets on-chain:", allBets.length);

      // Filter for this player's bets
      const playerBets = allBets.filter((bet) => {
        const isPlayerBet = bet.account.player.equals(wallet.publicKey);
        console.log(
          `Bet event ${bet.account.eventId.toNumber()}: player=${bet.account.player.toBase58()}, matches=${isPlayerBet}`
        );
        return isPlayerBet;
      });

      console.log("Player's bets:", playerBets.length);

      if (playerBets.length === 0) {
        setBets([]);
        setLoading(false);
        return;
      }

      // Fetch event details for each bet
      const betsWithDetails = await Promise.all(
        playerBets.map(async (bet) => {
          try {
            const [eventPda] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("event"),
                bet.account.eventId.toArrayLike(Buffer, "le", 8),
              ],
              program.programId
            );

            console.log(
              `Fetching event ${bet.account.eventId.toNumber()} at ${eventPda.toBase58()}`
            );

            const eventAccount = await program.account.oracleEvent.fetch(
              eventPda
            );

            const won =
              eventAccount.resolved &&
              bet.account.outcome === eventAccount.outcome;

            return {
              eventId: bet.account.eventId.toNumber(),
              eventDescription: eventAccount.description,
              outcome: bet.account.outcome,
              amount: bet.account.amount.toNumber() / 1e9,
              resolved: eventAccount.resolved,
              eventOutcome: eventAccount.outcome ?? undefined,
              won,
            };
          } catch (error) {
            console.error(
              `Error fetching event ${bet.account.eventId.toNumber()}:`,
              error
            );
            return null;
          }
        })
      );

      const validBets = betsWithDetails
        .filter((bet: PlayerBet) => bet !== null)
        .sort((a: PlayerBet, b: PlayerBet) => b.eventId - a.eventId);

      console.log("Valid bets with details:", validBets);
      setBets(validBets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && wallet) {
      fetchPlayerBets();
    }
  }, [isOpen, wallet]);

  if (!wallet) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg shadow-lg font-bold z-40 flex items-center gap-2"
      >
        📜 Quest Log {bets.length > 0 && `(${bets.length})`}
      </button>

      {/* Quest Log Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-gray-800 rounded-lg shadow-2xl z-50 max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">📜 Your Bets</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading your bets...
              </div>
            ) : bets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🎲</div>
                <p>No bets placed yet</p>
                <p className="text-sm mt-2">
                  Explore the dungeon and find oracles!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.map((bet, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      bet.resolved
                        ? bet.won
                          ? "bg-green-900 bg-opacity-30 border border-green-600"
                          : "bg-red-900 bg-opacity-30 border border-red-600"
                        : "bg-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-purple-400">
                        Event #{bet.eventId}
                      </span>
                      {bet.resolved ? (
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            bet.won
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {bet.won ? "✅ WON" : "❌ LOST"}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white font-bold">
                          ⏳ PENDING
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-2 line-clamp-2">
                      {bet.eventDescription}
                    </p>

                    <div className="flex justify-between items-center text-xs">
                      <span>
                        Your bet:{" "}
                        <span
                          className={
                            bet.outcome ? "text-green-400" : "text-red-400"
                          }
                        >
                          {bet.outcome ? "YES" : "NO"}
                        </span>
                      </span>
                      <span className="font-bold">{bet.amount} SOL</span>
                    </div>

                    {bet.resolved && (
                      <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
                        Outcome:{" "}
                        <span
                          className={
                            bet.eventOutcome ? "text-green-400" : "text-red-400"
                          }
                        >
                          {bet.eventOutcome ? "YES" : "NO"}
                        </span>
                        {bet.won && (
                          <span className="ml-2 text-green-400 font-bold">
                            +{(bet.amount * 2).toFixed(2)} SOL
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-700">
            <button
              onClick={fetchPlayerBets}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm"
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
