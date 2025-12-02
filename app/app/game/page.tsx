"use client";

import { useRef, useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { placeBet } from "@/lib/program-interactions";
import BetModal from "@/components/BetModal";
import { PhaserGame, IRefPhaserGame } from "./PhaserGame";
import { EventBus } from "./EventBus";
import { OracleEvent } from "@/lib/mock-data";

export default function GamePage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const wallet = useAnchorWallet();
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OracleEvent | null>(null);

  useEffect(() => {
    const handleOracleInteract = (event: OracleEvent) => {
      setSelectedEvent(event);
      setShowBetModal(true);
    };

    EventBus.on("oracle-interact", handleOracleInteract);

    return () => {
      EventBus.off("oracle-interact", handleOracleInteract);
    };
  }, []);

  const handlePlaceBet = async (
    eventId: number,
    outcome: boolean,
    amount: number
  ) => {
    if (!wallet) {
      throw new Error("Wallet not connected");
    }

    const result = await placeBet(wallet, eventId, outcome, amount);

    if (!result.success) {
      throw new Error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎮 ZK Oracle Quest</h1>
        <WalletMultiButton />
      </div>

      <div className="flex justify-center items-center p-8">
        <div className="border-4 border-purple-500 rounded-lg">
          <PhaserGame ref={phaserRef} />
        </div>
      </div>

      {showBetModal && selectedEvent && (
        <BetModal
          event={selectedEvent}
          isOpen={showBetModal}
          onClose={() => setShowBetModal(false)}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </div>
  );
}
