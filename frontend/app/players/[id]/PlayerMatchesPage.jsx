"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Table from "@/components/Table";
import AddMatch from "../AddMatch";

const PlayerMatchesPage = ({ id, playerData }) => {
  const router = useRouter();
  const params = useParams();

  const calculateAvg = useCallback(
    (name) => {
      const matches = playerData?.matches ?? [];

      const sum = matches.reduce((acc, curr) => {
        return acc + (curr.match_summary?.[name] ?? 0);
      }, 0);

      return matches.length ? (sum / matches.length).toFixed(1) : 0;
    },
    [playerData],
  );

  const initialMatches = useMemo(() => {
    return (
      playerData?.matches?.map((item) => ({
        id: item.id,
        opponent: item.opponent,
        date: new Date(item.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
        type: item.match_type,
        score: item.match_summary?.overall_score,
        status: item.status,
      })) ?? []
    );
  }, [playerData]);

  const [matches, setMatches] = useState(initialMatches);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("Connected");
    };

    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);

      console.log("WebSocket:", message);

      if (message.type === "MATCH_STATUS") {
        setMatches((prev) =>
          prev.map((match) =>
            match.id === message.matchId
              ? {
                  ...match,
                  status: message.status,
                }
              : match,
          ),
        );
      }
    };

    ws.onclose = () => console.log("Disconnected");

    return () => ws.close();
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <AddMatch isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} id={params.id} setMatches={setMatches} />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center py-4 bg-white dark:bg-black sm:items-start">
        <button
          className="text-black bg-white rounded-lg px-2 py-1 ml-4"
          onClick={() => router.back()}
        >
          Back
        </button>

        <span className="text-3xl m-4 text-white">{playerData?.name}</span>

        <span className="text-sm text-gray-500 mx-4">
          Number of Matches Recorded {playerData?.matches?.length}
        </span>

        {/* Stats */}

        <div className="w-full mx-4 my-6 flex gap-4">
          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Total Matches</p>

            <p className="text-xl text-gray-300 mx-4">
              {playerData?.matches?.length}
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Last Match</p>

            <p className="text-xl text-gray-300 mx-4">
              {new Date(
                playerData?.matches[playerData?.matches.length - 1]?.created_at,
              ).toLocaleDateString("en-GB")}
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">
              Avg Court Coverage
            </p>

            <p className="text-xl text-gray-300 mx-4">
              {calculateAvg("court_coverage_percent")}%
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Avg Shot Accuracy</p>

            <p className="text-xl text-gray-300 mx-4">
              {calculateAvg("shot_accuracy_percent")}%
            </p>
          </div>
        </div>

        <div className="w-full mx-4 my-6 flex">
          <div className="border-t border-gray-600 w-[45%] my-auto"></div>
          <span className="text-xs text-gray-600 mx-2">MATCH HISTORY</span>
          <div className="border-t border-gray-600 w-[45%] my-auto"></div>
        </div>

        <button
          className="ml-auto mr-1 border rounded-md px-3 py-1 hover:bg-gray-700"
          onClick={() => setIsModalOpen(true)}
        >
          Upload Match
        </button>

        <div className="w-full m-4">
          <Table
            columnHeads={["Opponent", "Date", "Type", "Score", "Status"]}
            allMatches={matches}
            allPlayers={[]}
          />
        </div>
      </main>
    </div>
  );
};

export default PlayerMatchesPage;
