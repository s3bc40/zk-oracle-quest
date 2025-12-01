"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import Link from "next/link";
import { mockEvents, OracleEvent } from "../../lib/mock-data";

export default function EventsPage() {
  const { connected } = useWallet();
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredEvents = mockEvents.filter((event) => {
    if (filter === "active" && event.resolved) return false;
    if (filter === "resolved" && !event.resolved) return false;
    if (categoryFilter !== "all" && event.category !== categoryFilter)
      return false;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "crypto":
        return "bg-purple-600";
      case "sports":
        return "bg-green-600";
      case "politics":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 mb-2 block"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold">📊 Oracle Events</h1>
          </div>
          <WalletMultiButton />
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all" ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg ${
                filter === "active" ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-4 py-2 rounded-lg ${
                filter === "resolved" ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === "all" ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter("crypto")}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === "crypto" ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              Crypto
            </button>
            <button
              onClick={() => setCategoryFilter("sports")}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === "sports" ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              Sports
            </button>
            <button
              onClick={() => setCategoryFilter("politics")}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === "politics" ? "bg-red-600" : "bg-gray-700"
              }`}
            >
              Politics
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              getCategoryColor={getCategoryColor}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No events found matching your filters</p>
          </div>
        )}
      </div>
    </main>
  );
}

function EventCard({
  event,
  getCategoryColor,
}: {
  event: OracleEvent;
  getCategoryColor: (cat: string) => string;
}) {
  const yesPercentage =
    event.totalBets > 0 ? (event.yesVotes / event.totalBets) * 100 : 50;
  const noPercentage = 100 - yesPercentage;

  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors flex flex-col h-full">
      {/* Category Badge & Status */}
      <div className="flex justify-between items-center mb-4">
        <span
          className={`${getCategoryColor(
            event.category
          )} px-3 py-1 rounded-full text-xs font-semibold uppercase`}
        >
          {event.category}
        </span>
        {event.resolved && (
          <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
            {event.outcome ? "✅ YES" : "❌ NO"}
          </span>
        )}
      </div>

      {/* Description - Fixed height for alignment */}
      <h3 className="text-lg font-semibold mb-4 min-h-14 leading-tight">
        {event.description}
      </h3>

      {/* Stats Section */}
      <div className="mb-4 grow">
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-gray-900 rounded px-3 py-2">
            <p className="text-gray-400 text-xs mb-1">Total Bets</p>
            <p className="font-bold text-white">{event.totalBets}</p>
          </div>
          <div className="bg-gray-900 rounded px-3 py-2">
            <p className="text-gray-400 text-xs mb-1">Deadline</p>
            <p className="font-bold text-white text-xs">
              {event.deadline.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Vote Distribution */}
        <div className="space-y-3 bg-gray-900 rounded p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold w-10 text-green-400">
              YES
            </span>
            <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden relative">
              <div
                className="bg-linear-to-r from-green-500 to-green-400 h-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage > 15 && (
                  <span className="text-xs font-bold text-white">
                    {yesPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
              {yesPercentage <= 15 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {yesPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold w-10 text-red-400">NO</span>
            <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden relative">
              <div
                className="bg-linear-to-r from-red-500 to-red-400 h-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage > 15 && (
                  <span className="text-xs font-bold text-white">
                    {noPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
              {noPercentage <= 15 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {noPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button - Always at bottom */}
      <div className="mt-auto pt-4">
        {!event.resolved ? (
          <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl">
            Place Bet
          </button>
        ) : (
          <button className="w-full bg-gray-700 py-3 rounded-lg font-semibold cursor-not-allowed opacity-60">
            Event Resolved
          </button>
        )}
      </div>
    </div>
  );
}
