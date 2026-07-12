
import React from 'react'
import {getMatchById} from "../../../service/matches"
import MatchReport from '../MatchReport'

const MatchReportPage = async ({params}) => {
  const {id} = await params
  const matchData = await getMatchById(id)

  return (
    <div>
      <MatchReport matchData={matchData} id={id} />
    </div>
  )
}

export default MatchReportPage
