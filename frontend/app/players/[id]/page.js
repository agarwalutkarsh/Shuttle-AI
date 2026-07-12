
import React from 'react'
import {getPlayerById} from "../../../service/players"
import PlayerMatchesPage from './PlayerMatchesPage'

const PlayerId = async ({params}) => {

    const {id} = await params
    // const getPlayerMatches = await getAllMatchesByPlayerId(id)
    const playerData = await getPlayerById(id)

  return (
    <div>
      <PlayerMatchesPage id={id} playerData={playerData} />
    </div>
  )
}

export default PlayerId
