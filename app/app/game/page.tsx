"use client";

import { useRef, useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { placeBet } from "@/lib/program-interactions";
import BetModal from "@/components/BetModal";
import { PhaserGame, IRefPhaserGame } from "./PhaserGame";
import { EventBus } from "./EventBus";
import { OracleEvent } from "@/lib/mock-data";
import { getProgram } from "@/lib/anchor-client";
import { PublicKey } from "@solana/web3.js";
import QuestLog from "@/components/QuestLog";

export default function GamePage() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const wallet = useAnchorWallet();
  const router = useRouter();
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OracleEvent | null>(null);
  const [playerInitialized, setPlayerInitialized] = useState<boolean | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(true);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Check if player is initialized
  useEffect(() => {
    const checkPlayerProfile = async () => {
      if (!wallet) {
        setIsChecking(false);
        return;
      }

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
        setIsChecking(false);
      }
    };

    checkPlayerProfile();
  }, [wallet]);

  // Fetch events and send to Phaser
  useEffect(() => {
    if (!wallet || !playerInitialized) {
      console.log(
        "GamePage: Skipping event setup - no wallet or player not initialized"
      );
      return;
    }

    console.log("GamePage: Setting up event handlers");

    let isMounted = true;
    let requestTimeout: NodeJS.Timeout | null = null;

    const fetchAndSendEvents = async () => {
      console.log("GamePage: fetchAndSendEvents called, isMounted:", isMounted);

      if (!wallet || !isMounted) {
        console.log("GamePage: Skipping fetch - no wallet or unmounted");
        return;
      }

      try {
        console.log("GamePage: Fetching events from blockchain...");
        const program = getProgram(wallet);
        const allEvents = await program.account.oracleEvent.all();

        if (!isMounted) {
          console.log("GamePage: Component unmounted during fetch, aborting");
          return;
        }

        const formattedEvents: OracleEvent[] = allEvents.map((event) => ({
          id: event.account.eventId.toNumber(),
          description: event.account.description,
          category: "crypto",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalBets: event.account.totalBets.toNumber(),
          yesVotes: event.account.yesVotes.toNumber(),
          noVotes: event.account.noVotes.toNumber(),
          resolved: event.account.resolved,
          outcome: event.account.outcome ?? undefined,
        }));

        console.log(
          "GamePage: Sending events to Phaser:",
          formattedEvents.length
        );

        if (formattedEvents && Array.isArray(formattedEvents)) {
          EventBus.emit("events-loaded", formattedEvents);
          setEventsLoaded(true);
        } else {
          console.warn("GamePage: Invalid events data");
          EventBus.emit("events-loaded", []);
          setEventsLoaded(true);
        }
      } catch (error) {
        console.error("GamePage: Error fetching events:", error);
        if (isMounted) {
          EventBus.emit("events-loaded", []);
          setEventsLoaded(true);
        }
      }
    };

    const handleRequestEvents = () => {
      console.log("GamePage: Phaser requested events");

      // Clear any pending request
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }

      // Debounce the request slightly
      requestTimeout = setTimeout(() => {
        if (isMounted) {
          fetchAndSendEvents();
        }
      }, 100);
    };

    EventBus.on("request-events", handleRequestEvents);

    return () => {
      console.log("GamePage: Cleaning up event listeners");
      isMounted = false;
      if (requestTimeout) {
        clearTimeout(requestTimeout);
      }
      EventBus.off("request-events", handleRequestEvents);
    };
  }, [wallet, playerInitialized]);

  useEffect(() => {
    const handleOracleInteract = (event: OracleEvent) => {
      console.log("Oracle interaction:", event);
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

    // Refresh events after placing bet
    try {
      const program = getProgram(wallet);
      const allEvents = await program.account.oracleEvent.all();
      const formattedEvents: OracleEvent[] = allEvents.map((event) => ({
        id: event.account.eventId.toNumber(),
        description: event.account.description,
        category: "crypto",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalBets: event.account.totalBets.toNumber(),
        yesVotes: event.account.yesVotes.toNumber(),
        noVotes: event.account.noVotes.toNumber(),
        resolved: event.account.resolved,
        outcome: event.account.outcome ?? undefined,
      }));
      EventBus.emit("events-loaded", formattedEvents);
    } catch (error) {
      console.error("Error refreshing events:", error);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl">Checking player profile...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-4 bg-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎮 ZK Oracle Quest</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white"
            >
              ← Home
            </button>
            <WalletMultiButton />
          </div>
        </div>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
            <p className="text-gray-400 mb-6">
              Please connect your wallet to play the game
            </p>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  // Player not initialized
  if (!playerInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-4 bg-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎮 ZK Oracle Quest</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white"
            >
              ← Home
            </button>
            <WalletMultiButton />
          </div>
        </div>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Player Not Initialized</h2>
            <p className="text-gray-400 mb-6">
              You need to initialize your player profile before entering the
              game.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-purple-600 hover:bg-purple-700 py-3 px-8 rounded-lg text-lg font-bold"
            >
              Go to Home & Initialize
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game loaded - player is ready!
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎮 ZK Oracle Quest</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white"
          >
            ← Home
          </button>
          <WalletMultiButton />
        </div>
      </div>

      {/* Loading indicator while events are being fetched */}
      {!eventsLoaded && (
        <div className="fixed top-20 right-4 bg-blue-900 bg-opacity-90 px-4 py-2 rounded-lg z-50">
          <p className="text-sm">⏳ Loading oracle events...</p>
        </div>
      )}

      <div className="flex justify-center items-center p-8">
        <div className="border-4 border-purple-500 rounded-lg">
          <PhaserGame ref={phaserRef} />
        </div>
      </div>

      {/* Quest Log */}
      <QuestLog />

      {/* Bet Modal */}
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
