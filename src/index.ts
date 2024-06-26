import express from "express";
import { db } from "./db";
import { battingStats, bowlingStats, players } from "./db/schema";
import cors from "cors";
import fileupload from "express-fileupload";
import cloudinary from "cloudinary";
import { eq } from "drizzle-orm";
import { differenceInYears } from "date-fns";
const app = express();
app.use(express.json());
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(
  cors({
    origin: "*",
  })
);
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.get("/players", async (req, res) => {
  const result = await db
    .select({
      name: players.name,
      profile: players.profile,
      role: players.role,
      id: players.id,
    })
    .from(players);
  res.json(result);
});

app.post("/players", async (req, res) => {
  const { name, role, battingStyle, bowlingStyle, dob } = req.body;
  console.log("files", req.files);
  console.log("body", req.body);
  let profileUrl = "";

  if (req.files && req.files.profile) {
    const profileFile: any = req.files.profile;
    try {
      const result = await cloudinary.v2.uploader.upload(
        profileFile.tempFilePath,
        {
          folder: "player_profiles",
        }
      );
      profileUrl = result.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return res.status(500).json({ error: "Failed to upload image" });
    }
  }

  try {
    const playerResult = await db.insert(players).values({
      name,
      role,
      battingStyle,
      bowlingStyle,
      profile: profileUrl,
      dob,
    });

    const playerId: any = playerResult.lastInsertRowid;

    await db.insert(battingStats).values({
      playerId,
      matches: 0,
      innings: 0,
      runs: 0,
      ballsFaced: 0,
      outs: 0,
      highScore: 0,
    });

    await db.insert(bowlingStats).values({
      playerId,
      matches: 0,
      innings: 0,
      wickets: 0,
      overs: 0,
      runsConceded: 0,
      bestBowling: "0/0",
    });

    res.json(playerResult);
  } catch (error) {
    console.error("Error inserting player data:", error);
    res.status(500).json({ error: "Failed to add player" });
  }
});

app.get("/players/:id", async (req, res) => {
  const { id } = req.params;
  const idInt = parseInt(id);

  try {
    const playerWithStats = await db
      .select({
        player: players,
        battingStats: battingStats,
        bowlingStats: bowlingStats,
      })
      .from(players)
      .leftJoin(battingStats, eq(players.id, battingStats.playerId))
      .leftJoin(bowlingStats, eq(players.id, bowlingStats.playerId))
      .where(eq(players.id, idInt))
      .get();

    if (!playerWithStats) {
      return res.status(404).json({ message: "Player not found" });
    }

    const dob = new Date(playerWithStats.player.dob);
    const today = new Date();
    const age = differenceInYears(today, dob);
    console.log("hehe", playerWithStats.battingStats?.outs || 0);
    const playerWithAge = {
      id: playerWithStats.player.id,
      name: playerWithStats.player.name,
      dob: playerWithStats.player.dob,
      age: age,
      profile: playerWithStats.player.profile,
      role: playerWithStats.player.role,
      battingStyle: playerWithStats.player.battingStyle,
      bowlingStyle: playerWithStats.player.bowlingStyle,

      // Batting stats
      batMatches: playerWithStats.battingStats?.matches || 0,
      batInnings: playerWithStats.battingStats?.innings || 0,
      runs: playerWithStats.battingStats?.runs || 0,
      ballsFaced: playerWithStats.battingStats?.ballsFaced || 0,
      outs: playerWithStats.battingStats?.outs || 0,
      highScore: playerWithStats.battingStats?.highScore,
      average:
        (playerWithStats.battingStats?.runs || 0) /
        (playerWithStats.battingStats?.outs || 0),
      strikeRate:
        ((playerWithStats.battingStats?.runs || 0) /
          (playerWithStats.battingStats?.ballsFaced || 0)) *
        100,
      notOuts:
        (playerWithStats.battingStats?.innings || 0) -
        (playerWithStats.battingStats?.outs || 0),
      // Bowling stats
      bowlMatches: playerWithStats.bowlingStats?.matches || 0,
      bownInnings: playerWithStats.bowlingStats?.innings || 0,
      overs: playerWithStats.bowlingStats?.overs,
      wickets: playerWithStats.bowlingStats?.wickets,
      economy:
        (playerWithStats.bowlingStats?.runsConceded || 0) /
        (playerWithStats.bowlingStats?.overs || 0),
      runsConceded: playerWithStats.bowlingStats?.runsConceded,
      bestBowling: playerWithStats.bowlingStats?.bestBowling,
    };

    res.status(200).json(playerWithAge);
  } catch (error) {
    console.error("Error fetching player data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
const parseBowlingFigures = (figures: any) => {
  if (!figures) return { wickets: 0, runs: 0 };
  const [wickets, runs] = figures.split("/").map(Number);
  return { wickets, runs };
};

const isBetterBowling = (current: any, best: any) => {
  if (current.wickets > best.wickets) return true;
  if (current.wickets === best.wickets && current.runs < best.runs) return true;
  return false;
};

app.post(`/players/:id`, async (req, res) => {
  const {
    wickets,
    overs,
    runs,
    ballsFaced,
    didNotBat,
    didNotBowl,
    runsConceded,
  } = req.body;
  const { id } = req.params;
  console.log("Received data:", req.body);

  // Sanitize and log input
  const sanitizedData = {
    id: parseInt(id),
    runs: runs === "" ? 0 : parseInt(runs),
    ballsFaced: ballsFaced === "" ? 0 : parseInt(ballsFaced),
    wickets: wickets === "" ? 0 : parseInt(wickets),
    overs: overs === "" ? 0 : parseFloat(overs),
    didNotBat: Boolean(didNotBat),
    didNotBowl: Boolean(didNotBowl),
    runsConceded: runsConceded === "" ? 0 : parseInt(runsConceded),
  };
  console.log("Sanitized data:", sanitizedData);
  const currentBowling = {
    wickets: sanitizedData.wickets,
    runs: sanitizedData.runsConceded,
  };

  let isNotOut = typeof runs === "string" && runs.includes("*");

  if (didNotBat) {
    isNotOut = true;
  }

  try {
    // Fetch existing player stats
    const playerWithStats = await db
      .select({
        player: players,
        battingStats: battingStats,
        bowlingStats: bowlingStats,
      })
      .from(players)
      .leftJoin(battingStats, eq(players.id, battingStats.playerId))
      .leftJoin(bowlingStats, eq(players.id, bowlingStats.playerId))
      .where(eq(players.id, sanitizedData.id))
      .get();

    if (!playerWithStats) {
      return res.status(404).json({ error: "Player not found" });
    }
    const bestBowling = parseBowlingFigures(
      playerWithStats.bowlingStats?.bestBowling
    );

    console.log("best bowling", bestBowling);
    const newBestBowling = isBetterBowling(currentBowling, bestBowling)
      ? `${currentBowling.wickets}/${currentBowling.runs}`
      : playerWithStats.bowlingStats?.bestBowling;
    // Prepare batting stats update
    const battingUpdate = {
      matches: (playerWithStats.battingStats?.matches || 0) + 1,
      innings:
        (playerWithStats.battingStats?.innings || 0) +
        (sanitizedData.didNotBat ? 0 : 1),
      runs: (playerWithStats.battingStats?.runs || 0) + sanitizedData.runs,
      ballsFaced:
        (playerWithStats.battingStats?.ballsFaced || 0) +
        sanitizedData.ballsFaced,
      outs: (playerWithStats.battingStats?.outs || 0) + (isNotOut ? 0 : 1),
      highScore:
        sanitizedData.runs > (playerWithStats.battingStats?.highScore || 0)
          ? sanitizedData.runs
          : playerWithStats.battingStats?.highScore,
    };

    // Prepare bowling stats update
    const bowlingUpdate = {
      matches: (playerWithStats.bowlingStats?.matches || 0) + 1,
      innings:
        (playerWithStats.bowlingStats?.innings || 0) +
        (sanitizedData.didNotBowl ? 0 : 1),
      wickets:
        (playerWithStats.bowlingStats?.wickets || 0) + sanitizedData.wickets,
      overs: (playerWithStats.bowlingStats?.overs || 0) + sanitizedData.overs,
      runsConceded:
        (playerWithStats.bowlingStats?.runsConceded || 0) +
        sanitizedData.runsConceded,
      bestBowling: newBestBowling,
    };

    // Perform updates
    await db
      .update(battingStats)
      .set(battingUpdate)
      .where(eq(battingStats.playerId, sanitizedData.id));

    await db
      .update(bowlingStats)
      .set(bowlingUpdate)
      .where(eq(bowlingStats.playerId, sanitizedData.id));

    res.status(200).json({ message: "Player stats updated successfully" });
  } catch (error) {
    console.error("Error updating player stats:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating player stats" });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
