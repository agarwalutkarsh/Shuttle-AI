"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getStatusLabel, getStatusStyle } from "@/helperfunc";
import InsightsList from "./InsightList";
import RallyBreakdown from "./RallyBreakdown";

const MatchReport = ({ matchData, id }) => {
  const router = useRouter();
  console.log(matchData);
  const calculateWinRate = (rallies) => {
    const won = rallies?.reduce((acc, curr) => {
      acc = curr?.winner != "opponent" ? acc + 1 : acc;
      return acc;
    }, 0);
    return ((won / rallies?.length) * 100).toFixed(1);
  };
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center py-4 bg-white dark:bg-black sm:items-start">
        <button
          className="text-black bg-white rounded-lg px-2 py-1 ml-4"
          onClick={() => router.back()}
        >
          Back
        </button>

        <span className="text-3xl m-4 mb-0 text-white w-full flex">
          vs {matchData?.opponent}
          <p className="text-gray-600 text-sm h-max ml-2 mt-3">
            {(matchData?.duration_seconds / 60).toFixed(2)} min
          </p>
          <div className="ml-auto mr-3 text-white/80">
            <span className="w-full flex">
              {matchData?.match_summary?.overall_score}
              <p className="text-gray-600/80 text-sm h-max mt-3">/100</p>
            </span>
            <p className="text-gray-500 text-xs">Overall Score</p>
          </div>
        </span>

        <div className="flex gap-3 mt-2 mx-4 w-full">
          <span className="inline-flex rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700">
            {matchData.match_type}
          </span>
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusStyle(matchData.status)}`}
          >
            {getStatusLabel(matchData.status)}
          </span>
          <span className="inline-flex rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700 ml-auto mr-2">
            {new Date(matchData.processed_at).toLocaleDateString("en-GB")}
          </span>
        </div>

        <div className="w-full mx-4 my-6 flex gap-4">
          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Win Rate</p>

            <p className="text-xl text-gray-300 mx-4">
              {calculateWinRate(matchData?.rallies)}%
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Rallies</p>

            <p className="text-xl text-gray-300 mx-4">
              {matchData?.rallies?.length}
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Court Coverage</p>

            <p className="text-xl text-gray-300 mx-4">
              {matchData?.match_summary?.court_coverage_percent}%
            </p>
          </div>

          <div className="w-1/4 h-20 bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-400 mx-4 my-3">Dominant Shot</p>

            <p className="text-xl text-gray-300 mx-4">
              {matchData?.match_summary?.dominant_shot}
            </p>
          </div>
        </div>

          <InsightsList insights={matchData?.insights} />
          <RallyBreakdown rallies={matchData?.rallies} />

        {/* <div className="w-full mx-4 my-6 flex">
          <div className="border-t border-gray-600 w-[45%] my-auto"></div>
          <span className="text-xs text-gray-600 mx-2">MATCH HISTORY</span>
          <div className="border-t border-gray-600 w-[45%] my-auto"></div>
        </div> */}

        {/* <button
          className="ml-auto mr-1 border rounded-md px-3 py-1 hover:bg-gray-700"
          onClick={() => setIsModalOpen(true)}
        >
          Upload Match
        </button> */}

        {/* <div className="w-full m-4">
          <Table
            columnHeads={["Opponent", "Date", "Type", "Score", "Status"]}
            allMatches={matches}
            allPlayers={[]}
          />
        </div> */}
      </main>
    </div>
  );
};

export default MatchReport;
