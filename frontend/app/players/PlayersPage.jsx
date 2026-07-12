"use client"

import AddPlayer from '@/components/AddPlayer'
import Table from '@/components/Table'
import React, { useState } from 'react'

const PlayersPage = ({allPlayers}) => {

    const [players, setPlayers] = useState([...allPlayers])

    const updateList = (resp) => {
        setPlayers(prev => ([...prev, resp]))
    }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-4 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
        <AddPlayer updatePlayersList={updateList} />
        <Table columnHeads={['Player Id', 'Player', 'Matches', 'Created At']} allPlayers={players} />
        </div>
      </main>
    </div>
  )
}

export default PlayersPage
