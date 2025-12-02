"use client";

import { useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { OracleEvent } from "@/lib/mock-data";
import { getUserBet } from "@/lib/program-interactions";

interface BetModalProps {
  event: OracleEvent;
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (
    eventId: number,
    outcome: boolean,
    amount: number
  ) => Promise<void>;
}

export default function BetModal({
  event,
  isOpen,
  onClose,
  onPlaceBet,
}: BetModalProps) {
  const wallet = useAnchorWallet();
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const [amount, setAmount] = useState<string>("0.1");
  const [loading, setLoading] = useState(false);
  const [existingBet, setExistingBet] = useState<{
    exists: boolean;
    outcome?: boolean;
    amount?: number;
    claimed?: boolean;
  } | null>(null);
  const [checkingBet, setCheckingBet] = useState(true);

  // Check for existing bet when modal opens
  useEffect(() => {
    const checkBet = async () => {
      if (!wallet || !isOpen) {
        setCheckingBet(false);
        return;
      }

      setCheckingBet(true);
      const bet = await getUserBet(wallet, event.id);
      setExistingBet(bet);
      setCheckingBet(false);
    };

    checkBet();
  }, [wallet, event.id, isOpen]);

  if (!isOpen) return null;

  const handlePlaceBet = async () => {
    if (outcome === null) {
      alert("Please select YES or NO");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await onPlaceBet(event.id, outcome, amountNum);
      alert(
        `✅ Bet placed successfully!\n\n${amountNum} SOL on ${
          outcome ? "YES" : "NO"
        }`
      );
      onClose();
    } catch (error: unknown) {
      console.error("Error placing bet:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`❌ Error placing bet: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = event.yesVotes + event.noVotes;
  const yesPercent = totalVotes > 0 ? (event.yesVotes / totalVotes) * 100 : 50;
  const noPercent = totalVotes > 0 ? (event.noVotes / totalVotes) * 100 : 50;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">🔮 Oracle Prediction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">{event.description}</p>
          <div className="text-sm text-gray-400">
            Event ID: #{event.id} •{" "}
            {event.resolved ? "🔴 RESOLVED" : "🟢 ACTIVE"}
          </div>
        </div>

        {/* Vote Statistics */}
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Current Votes</span>
            <span className="text-sm font-bold">{totalVotes} total</span>
          </div>

          {/* Vote Bar */}
          <div className="flex h-6 rounded-full overflow-hidden mb-2">
            <div
              className="bg-green-600 flex items-center justify-center text-xs font-bold"
              style={{ width: `${yesPercent}%` }}
            >
              {yesPercent > 15 && `${yesPercent.toFixed(0)}%`}
            </div>
            <div
              className="bg-red-600 flex items-center justify-center text-xs font-bold"
              style={{ width: `${noPercent}%` }}
            >
              {noPercent > 15 && `${noPercent.toFixed(0)}%`}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-green-400">✅ YES: {event.yesVotes}</span>
            <span className="text-red-400">❌ NO: {event.noVotes}</span>
          </div>
        </div>

        {/* Existing Bet Warning */}
        {checkingBet ? (
          <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4 text-center">
            <p className="text-sm">Checking your bets...</p>
          </div>
        ) : existingBet?.exists ? (
          <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg mb-4 border border-yellow-600">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="font-bold mb-1">You Already Placed a Bet!</p>
                <p className="text-sm mb-2">
                  Your bet:{" "}
                  <span
                    className={
                      existingBet.outcome ? "text-green-400" : "text-red-400"
                    }
                  >
                    {existingBet.outcome ? "YES" : "NO"}
                  </span>{" "}
                  • {existingBet.amount} SOL
                </p>
                <p className="text-xs text-gray-400">
                  You can only place one bet per event. Check your Quest Log to
                  track this bet.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {event.resolved ? (
          <div className="bg-purple-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <div className="text-center">
              <div className="text-2xl mb-2">{event.outcome ? "✅" : "❌"}</div>
              <p className="font-bold">
                Event Resolved: {event.outcome ? "YES" : "NO"}
              </p>
            </div>
          </div>
        ) : !checkingBet && !existingBet?.exists ? (
          <>
            {/* Outcome Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">
                Your Prediction:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutcome(true)}
                  className={`py-3 px-4 rounded-lg font-bold ${
                    outcome === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  ✅ YES
                </button>
                <button
                  onClick={() => setOutcome(false)}
                  className={`py-3 px-4 rounded-lg font-bold ${
                    outcome === false
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  ❌ NO
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">
                Bet Amount (SOL):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                placeholder="0.1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Potential winnings: {(parseFloat(amount) * 2).toFixed(2)} SOL
              </p>
            </div>

            {/* Place Bet Button */}
            <button
              onClick={handlePlaceBet}
              disabled={loading || outcome === null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Placing Bet..." : "Place Bet"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
