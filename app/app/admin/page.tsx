"use client";

import { useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  createEvent,
  resolveEvent,
  getAllBets,
  closeBet,
} from "@/lib/program-interactions";
import { getProgram } from "@/lib/anchor-client";
import { useRouter } from "next/navigation";

// Admin wallet public key
const ADMIN_WALLET = new PublicKey(
  "69jHhkYPRaMKDM139vYQvH3HsM8mWh9bCBLg44BHkr19"
);

interface OnChainEvent {
  eventId: number;
  description: string;
  resolved: boolean;
  outcome?: boolean;
  totalBets: number;
  yesVotes: number;
  noVotes: number;
  totalAmount: number;
}

interface BetInfo {
  pubkey: PublicKey;
  player: PublicKey;
  eventId: number;
  outcome: boolean;
  amount: number;
  claimed: boolean;
}

export default function AdminPage() {
  const wallet = useAnchorWallet();
  const router = useRouter();
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [allBets, setAllBets] = useState<BetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "bets">("events");

  // Create Event Form
  const [newEventId, setNewEventId] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");

  const isAdmin = wallet?.publicKey.equals(ADMIN_WALLET);

  // Fetch events
  const fetchEvents = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const program = getProgram(wallet);
      const allEvents = await program.account.oracleEvent.all();

      const formattedEvents: OnChainEvent[] = allEvents.map((event) => ({
        eventId: event.account.eventId.toNumber(),
        description: event.account.description,
        resolved: event.account.resolved,
        outcome: event.account.outcome ?? undefined,
        totalBets: event.account.totalBets.toNumber(),
        yesVotes: event.account.yesVotes.toNumber(),
        noVotes: event.account.noVotes.toNumber(),
        totalAmount: event.account.totalAmount.toNumber() / 1e9,
      }));

      setEvents(formattedEvents.sort((a, b) => a.eventId - b.eventId));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bets
  const fetchAllBets = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const bets = await getAllBets(wallet);
      setAllBets(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet) {
      fetchEvents();
      fetchAllBets();
    }
  }, [wallet]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !isAdmin) return;

    const eventId = parseInt(newEventId);
    if (isNaN(eventId)) {
      alert("Invalid event ID");
      return;
    }

    const result = await createEvent(wallet, eventId, newEventDescription);

    if (result.success) {
      alert(result.message);
      setNewEventId("");
      setNewEventDescription("");
      fetchEvents();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleResolveEvent = async (eventId: number, outcome: boolean) => {
    if (!wallet || !isAdmin) return;

    const confirmed = confirm(
      `Resolve Event #${eventId} to ${outcome ? "YES" : "NO"}?`
    );
    if (!confirmed) return;

    const result = await resolveEvent(wallet, eventId, outcome);

    if (result.success) {
      alert(result.message);
      fetchEvents();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const handleCloseBet = async (betPubkey: PublicKey) => {
    if (!wallet || !isAdmin) return;

    const confirmed = confirm(
      `Close bet ${betPubkey
        .toBase58()
        .slice(0, 8)}...?\n\nThis will refund the rent to your wallet.`
    );
    if (!confirmed) return;

    const result = await closeBet(wallet, betPubkey);

    if (result.success) {
      alert(result.message);
      fetchAllBets();
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-4 bg-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔧 Admin Panel</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white"
            >
              ← Home
            </button>
            <WalletMultiButton />
          </div>
          <WalletMultiButton />
        </div>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-4 bg-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔧 Admin Panel</h1>
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
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-400">
              Only the admin wallet can access this panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🔧 Admin Panel</h1>
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

      <div className="max-w-6xl mx-auto p-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === "events"
                ? "bg-purple-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            📅 Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === "bets"
                ? "bg-purple-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            🎲 All Bets ({allBets.length})
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === "events" && (
          <>
            {/* Create Event Form */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Event ID
                  </label>
                  <input
                    type="number"
                    value={newEventId}
                    onChange={(e) => setNewEventId(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                    placeholder="Will BTC hit $100k by 2025?"
                    maxLength={200}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
                >
                  ➕ Create Event
                </button>
              </form>
            </div>

            {/* Events List */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Oracle Events</h2>
                <button
                  onClick={fetchEvents}
                  disabled={loading}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
                >
                  {loading ? "Loading..." : "🔄 Refresh"}
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No events created yet
                </p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.eventId}
                      className="bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">
                            Event #{event.eventId}
                          </h3>
                          <p className="text-gray-300 text-sm">
                            {event.description}
                          </p>
                        </div>
                        {event.resolved ? (
                          <span className="bg-gray-600 px-3 py-1 rounded text-sm">
                            🔴 RESOLVED
                          </span>
                        ) : (
                          <span className="bg-green-600 px-3 py-1 rounded text-sm">
                            🟢 ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 my-3 text-sm">
                        <div>
                          <span className="text-gray-400">Total Bets:</span>
                          <div className="font-bold">{event.totalBets}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">YES Votes:</span>
                          <div className="font-bold text-green-400">
                            {event.yesVotes}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">NO Votes:</span>
                          <div className="font-bold text-red-400">
                            {event.noVotes}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Amount:</span>
                          <div className="font-bold">
                            {event.totalAmount.toFixed(2)} SOL
                          </div>
                        </div>
                      </div>

                      {event.resolved ? (
                        <div className="bg-purple-900 bg-opacity-50 p-3 rounded mt-3">
                          <p className="text-sm">
                            <span className="font-bold">Outcome:</span>{" "}
                            <span
                              className={
                                event.outcome
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {event.outcome ? "YES ✅" : "NO ❌"}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() =>
                              handleResolveEvent(event.eventId, true)
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold"
                          >
                            ✅ Resolve YES
                          </button>
                          <button
                            onClick={() =>
                              handleResolveEvent(event.eventId, false)
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
                          >
                            ❌ Resolve NO
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Bets Tab */}
        {activeTab === "bets" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">All Bets</h2>
              <button
                onClick={fetchAllBets}
                disabled={loading}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
              >
                {loading ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>

            {allBets.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No bets found</p>
            ) : (
              <div className="space-y-3">
                {allBets.map((bet, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="flex gap-4 items-center mb-2">
                        <span className="text-xs font-bold text-purple-400">
                          Event #{bet.eventId}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            bet.outcome ? "bg-green-600" : "bg-red-600"
                          }`}
                        >
                          {bet.outcome ? "YES" : "NO"}
                        </span>
                        <span className="text-xs font-bold">
                          {bet.amount} SOL
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Player: {bet.player.toBase58().slice(0, 16)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        Bet: {bet.pubkey.toBase58().slice(0, 16)}...
                      </div>
                    </div>
                    <button
                      onClick={() => handleCloseBet(bet.pubkey)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold"
                    >
                      🗑️ Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
