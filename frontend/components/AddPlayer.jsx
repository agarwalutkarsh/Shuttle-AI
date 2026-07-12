"use client";

import React, { useState } from 'react'
import {createPlayer} from "../service/players"

const AddPlayer = ({updatePlayersList}) => {
    const [playerName, setPlayerName] = useState('')

    const playerNameHandler = (value) => {
        setPlayerName(value)
    }

    const playerAddHandler = async () => {
        if (playerName === "") {
            return
        }
        const data = {
            name: playerName,
            created_at : new Date().toISOString()
        }

        const resp = await createPlayer(data)
        updatePlayersList(resp)
    }

  return (
    <>
    <div className='my-8'>
        <p className='text-xl'>Player</p>
        <p className='text-sm text-gray-500'>Add a new player or select one to view their matches</p>
        <div className='flex'>
        <input placeholder='Player Name' className='border-2 border-gray-500 rounded-sm p-2 my-4 w-[80%]' onChange={(e) => playerNameHandler
            (e.target.value)
        } />
        <button className="text-white border-2 rounded-md border-gray-500 m-4 w-[20%] cursor-pointer hover:bg-gray-700" onClick={() => playerAddHandler()} >+ Add Player</button>
        </div>
    </div>
    </>
  )
}

export default AddPlayer
