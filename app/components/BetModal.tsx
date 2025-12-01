"use client";

import { useState } from "react";
import { OracleEvent } from "../lib/mock-data";

interface BetModalProps {
  event: OracleEvent;
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (eventId: number, outcome: boolean, amount: number) => void;
}

export default function BetModal({
  event,
  isOpen,
  onClose,
  onPlaceBet,
}: BetModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [betAmount, setBetAmount] = useState<string>("0.1");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePlaceBet = async () => {
    if (selectedOutcome === null) {
      alert("Please select YES or NO");
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }

    setLoading(true);
    try {
      await onPlaceBet(event.id, selectedOutcome, amount);
      onClose();
    } catch (error) {
      console.error("Error placing bet:", error);
    } finally {
      setLoading(false);
    }
  };

  const potentialWinnings = parseFloat(betAmount) * 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-4">Place Your Bet</h2>

        {/* Event Description */}
        <div className="bg-gray-900 rounded p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Event:</p>
          <p className="font-semibold">{event.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            Deadline: {event.deadline.toLocaleDateString()}
          </p>
        </div>

        {/* Outcome Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3">
            {"What's your prediction?"}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedOutcome(true)}
              className={`py-4 rounded-lg font-bold transition-all ${
                selectedOutcome === true
                  ? "bg-green-600 ring-4 ring-green-400"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              ✅ YES
            </button>
            <button
              onClick={() => setSelectedOutcome(false)}
              className={`py-4 rounded-lg font-bold transition-all ${
                selectedOutcome === false
                  ? "bg-red-600 ring-4 ring-red-400"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              ❌ NO
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Bet Amount (SOL)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.1"
            />
            <span className="absolute right-4 top-3 text-gray-400">SOL</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <button
              onClick={() => setBetAmount("0.1")}
              className="hover:text-white"
            >
              0.1 SOL
            </button>
            <button
              onClick={() => setBetAmount("0.5")}
              className="hover:text-white"
            >
              0.5 SOL
            </button>
            <button
              onClick={() => setBetAmount("1")}
              className="hover:text-white"
            >
              1 SOL
            </button>
            <button
              onClick={() => setBetAmount("5")}
              className="hover:text-white"
            >
              5 SOL
            </button>
          </div>
        </div>

        {/* Potential Winnings */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Potential Winnings:</span>
            <span className="text-xl font-bold text-green-400">
              {potentialWinnings.toFixed(2)} SOL
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            (2x multiplier for winning bets)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePlaceBet}
            disabled={loading || selectedOutcome === null}
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Placing Bet..." : "Confirm Bet"}
          </button>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Your bet is private and stored as a compressed account using ZK
          proofs
        </p>
      </div>
    </div>
  );
}
