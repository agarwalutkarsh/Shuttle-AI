"use client"

import React, { useState } from "react";
import {createMatch} from "../../service/matches"

const AddMatch = ({ isOpen = false, onClose, id, setMatches }) => {
  const [formData, setFormData] = useState({
    opponent: "",
    date: "",
    type: "",
    video: null
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      match_date: formData?.date,
      opponent: formData?.opponent,
      player_id: id,
      match_type: formData.type,
      video: formData.video
    }
    console.log("Match data:", data);
    const resp = await createMatch(data)
    setMatches((prev) => ([...prev, resp]))
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-400">Upload Match</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Opponent</label>
            <input
              type="text"
              name="opponent"
              value={formData.opponent}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Enter opponent"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="e.g. Singles"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Video</label>
            <input
              type="file"
              name="video"
              accept="video/*"
              value={formData.score}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* <div>
            <label className="mb-1 block text-sm text-gray-400">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div> */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-gray-400 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMatch;
