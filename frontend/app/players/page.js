import React from "react";
import PlayersPage from "./PlayersPage";
import {getAllPlayers} from "../../service/players"

const page = async () => {
    const playersData = await getAllPlayers()
  return <PlayersPage allPlayers={playersData} />;
};

export default page;
