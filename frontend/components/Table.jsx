"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getStatusLabel, getStatusStyle } from "@/helperfunc";

const Table = ({
  columnHeads,
  allPlayers = [],
  allMatches = [],
}) => {
  const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mr-4">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">

        <thead className="text-xs font-semibold uppercase text-gray-700">
          <tr className="text-white">
            {columnHeads.map((head) => (
              <th key={head} className="px-6 py-3">
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-white">

          {allPlayers.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-800 cursor-pointer"
              onClick={() => router.push(`/players/${item.id}`)}
            >
              <td className="px-6 py-4">{item.id}</td>
              <td className="px-6 py-4">{item.name}</td>
              <td className="px-6 py-4">{item.matches ?? 0}</td>
              <td className="px-6 py-4">
                {new Date(item.created_at).toLocaleDateString("en-GB")}
              </td>
            </tr>
          ))}

          {allMatches.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-800"
              onClick={() => router.push(`/matchreport/${item.id}`)}
            >
              <td className="px-6 py-4">{item.opponent}</td>

              <td className="px-6 py-4">
                {item.date}
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-700">
                  {item.type}
                </span>
              </td>

              <td className="px-6 py-4">
                {item.score}
              </td>

              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusStyle(item.status)}`}
                >
                  {getStatusLabel(item.status)}
                </span>
              </td>
            </tr>
          ))}

        </tbody>

      </table>
    </div>
  );
};

export default Table;