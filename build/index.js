"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCloudImage = void 0;
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const cors_1 = __importDefault(require("cors"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const drizzle_orm_1 = require("drizzle-orm");
const date_fns_1 = require("date-fns");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));
app.use((0, cors_1.default)({
    origin: "*",
}));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
const deleteCloudImage = (ids, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ((_a = cloudinary_1.default.v2) === null || _a === void 0 ? void 0 : _a.api.delete_resources([ids], {
        resource_type: "image",
    }, (error, _) => {
        if (error) {
            return res.status(500).json({
                message: "Something went wrong while deleting image/video",
                status: 500,
            });
        }
    }));
});
exports.deleteCloudImage = deleteCloudImage;
app.get("/players", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.db
        .select({
        name: schema_1.players.name,
        profile: schema_1.players.profile,
        role: schema_1.players.role,
        id: schema_1.players.id,
    })
        .from(schema_1.players);
    res.json(result);
}));
app.post("/players", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, role, battingStyle, bowlingStyle, dob } = req.body;
    console.log("files", req.files);
    console.log("body", req.body);
    let profileUrl = "";
    if (req.files && req.files.profile) {
        const profileFile = req.files.profile;
        try {
            const result = yield cloudinary_1.default.v2.uploader.upload(profileFile.tempFilePath, {
                folder: "player_profiles",
            });
            profileUrl = result.secure_url;
        }
        catch (error) {
            console.error("Error uploading to Cloudinary:", error);
            return res.status(500).json({ error: "Failed to upload image" });
        }
    }
    try {
        const playerResult = yield db_1.db.insert(schema_1.players).values({
            name,
            role,
            battingStyle,
            bowlingStyle,
            profile: profileUrl,
            dob,
        });
        const playerId = playerResult.lastInsertRowid;
        yield db_1.db.insert(schema_1.battingStats).values({
            playerId,
            matches: 0,
            innings: 0,
            runs: 0,
            ballsFaced: 0,
            outs: 0,
            highScore: 0,
        });
        yield db_1.db.insert(schema_1.bowlingStats).values({
            playerId,
            matches: 0,
            innings: 0,
            wickets: 0,
            overs: 0,
            runsConceded: 0,
            bestBowling: "0/0",
        });
        res.json(playerResult);
    }
    catch (error) {
        console.error("Error inserting player data:", error);
        res.status(500).json({ error: "Failed to add player" });
    }
}));
app.get("/players/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const { id } = req.params;
    const idInt = parseInt(id);
    try {
        const playerWithStats = yield db_1.db
            .select({
            player: schema_1.players,
            battingStats: schema_1.battingStats,
            bowlingStats: schema_1.bowlingStats,
        })
            .from(schema_1.players)
            .leftJoin(schema_1.battingStats, (0, drizzle_orm_1.eq)(schema_1.players.id, schema_1.battingStats.playerId))
            .leftJoin(schema_1.bowlingStats, (0, drizzle_orm_1.eq)(schema_1.players.id, schema_1.bowlingStats.playerId))
            .where((0, drizzle_orm_1.eq)(schema_1.players.id, idInt))
            .get();
        if (!playerWithStats) {
            return res.status(404).json({ message: "Player not found" });
        }
        const dob = new Date(playerWithStats.player.dob);
        const today = new Date();
        const age = (0, date_fns_1.differenceInYears)(today, dob);
        console.log("hehe", ((_a = playerWithStats.battingStats) === null || _a === void 0 ? void 0 : _a.outs) || 0);
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
            batMatches: ((_b = playerWithStats.battingStats) === null || _b === void 0 ? void 0 : _b.matches) || 0,
            batInnings: ((_c = playerWithStats.battingStats) === null || _c === void 0 ? void 0 : _c.innings) || 0,
            runs: ((_d = playerWithStats.battingStats) === null || _d === void 0 ? void 0 : _d.runs) || 0,
            ballsFaced: ((_e = playerWithStats.battingStats) === null || _e === void 0 ? void 0 : _e.ballsFaced) || 0,
            outs: ((_f = playerWithStats.battingStats) === null || _f === void 0 ? void 0 : _f.outs) || 0,
            highScore: (_g = playerWithStats.battingStats) === null || _g === void 0 ? void 0 : _g.highScore,
            average: (((_h = playerWithStats.battingStats) === null || _h === void 0 ? void 0 : _h.runs) || 0) /
                (((_j = playerWithStats.battingStats) === null || _j === void 0 ? void 0 : _j.outs) || 0),
            strikeRate: ((((_k = playerWithStats.battingStats) === null || _k === void 0 ? void 0 : _k.runs) || 0) /
                (((_l = playerWithStats.battingStats) === null || _l === void 0 ? void 0 : _l.ballsFaced) || 0)) *
                100,
            notOuts: (((_m = playerWithStats.battingStats) === null || _m === void 0 ? void 0 : _m.innings) || 0) -
                (((_o = playerWithStats.battingStats) === null || _o === void 0 ? void 0 : _o.outs) || 0),
            // Bowling stats
            bowlMatches: ((_p = playerWithStats.bowlingStats) === null || _p === void 0 ? void 0 : _p.matches) || 0,
            bownInnings: ((_q = playerWithStats.bowlingStats) === null || _q === void 0 ? void 0 : _q.innings) || 0,
            overs: (_r = playerWithStats.bowlingStats) === null || _r === void 0 ? void 0 : _r.overs,
            wickets: (_s = playerWithStats.bowlingStats) === null || _s === void 0 ? void 0 : _s.wickets,
            economy: (((_t = playerWithStats.bowlingStats) === null || _t === void 0 ? void 0 : _t.runsConceded) || 0) /
                (((_u = playerWithStats.bowlingStats) === null || _u === void 0 ? void 0 : _u.overs) || 0),
            runsConceded: (_v = playerWithStats.bowlingStats) === null || _v === void 0 ? void 0 : _v.runsConceded,
            bestBowling: (_w = playerWithStats.bowlingStats) === null || _w === void 0 ? void 0 : _w.bestBowling,
        };
        console.log(playerWithAge.economy);
        res.status(200).json(playerWithAge);
    }
    catch (error) {
        console.error("Error fetching player data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.patch('/players/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const playerId = parseInt(req.params.id);
        const { name, role, battingStyle, bowlingStyle, dob } = req.body;
        // Fetch the current player data
        const currentPlayer = yield db_1.db.select().from(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.id, playerId)).get();
        if (!currentPlayer) {
            return res.status(404).json({ message: 'Player not found' });
        }
        // Prepare the update object
        const updateData = {
            name: name || currentPlayer.name,
            role: role || currentPlayer.role,
            battingStyle: battingStyle || currentPlayer.battingStyle,
            bowlingStyle: bowlingStyle || currentPlayer.bowlingStyle,
            dob: dob || currentPlayer.dob,
        };
        // Handle profile image update
        if (req.files) {
            // Delete the existing image from Cloudinary
            if (currentPlayer.profile) {
                const publicId = (_a = currentPlayer.profile.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
                if (publicId) {
                    yield (0, exports.deleteCloudImage)(publicId, res);
                }
            }
            const profileFile = req.files.profile;
            const result = yield cloudinary_1.default.v2.uploader.upload(profileFile.tempFilePath, {
                folder: "player_profiles",
            });
            // Upload the new image to Cloudinary
            // const result = await cloudinary.uploader.upload(req.file.path, {
            //   folder: 'player_profiles',
            // });
            updateData.profile = result.secure_url;
        }
        // Update the player in the database
        yield db_1.db.update(schema_1.players)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.players.id, playerId))
            .run();
        res.json({ message: 'Player updated successfully' });
    }
    catch (error) {
        next(error);
    }
}));
app.delete('/players/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const playerId = parseInt(req.params.id);
    const currentPlayer = yield db_1.db.select().from(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.id, playerId)).get();
    yield db_1.db.delete(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.id, currentPlayer.id));
    res.json({ messag: "Player deleted" });
}));
const parseBowlingFigures = (figures) => {
    if (!figures)
        return { wickets: 0, runs: 0 };
    const [wickets, runs] = figures.split("/").map(Number);
    return { wickets, runs };
};
const isBetterBowling = (current, best) => {
    if (current.wickets > best.wickets)
        return true;
    if (current.wickets === best.wickets && current.runs < best.runs)
        return true;
    return false;
};
app.post(`/players/:id`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const { wickets, overs, runs, ballsFaced, didNotBat, didNotBowl, runsConceded, } = req.body;
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
        const playerWithStats = yield db_1.db
            .select({
            player: schema_1.players,
            battingStats: schema_1.battingStats,
            bowlingStats: schema_1.bowlingStats,
        })
            .from(schema_1.players)
            .leftJoin(schema_1.battingStats, (0, drizzle_orm_1.eq)(schema_1.players.id, schema_1.battingStats.playerId))
            .leftJoin(schema_1.bowlingStats, (0, drizzle_orm_1.eq)(schema_1.players.id, schema_1.bowlingStats.playerId))
            .where((0, drizzle_orm_1.eq)(schema_1.players.id, sanitizedData.id))
            .get();
        if (!playerWithStats) {
            return res.status(404).json({ error: "Player not found" });
        }
        const bestBowling = parseBowlingFigures((_a = playerWithStats.bowlingStats) === null || _a === void 0 ? void 0 : _a.bestBowling);
        console.log("best bowling", bestBowling);
        const newBestBowling = isBetterBowling(currentBowling, bestBowling)
            ? `${currentBowling.wickets}/${currentBowling.runs}`
            : (_b = playerWithStats.bowlingStats) === null || _b === void 0 ? void 0 : _b.bestBowling;
        // Prepare batting stats update
        const battingUpdate = {
            matches: (((_c = playerWithStats.battingStats) === null || _c === void 0 ? void 0 : _c.matches) || 0) + 1,
            innings: (((_d = playerWithStats.battingStats) === null || _d === void 0 ? void 0 : _d.innings) || 0) +
                (sanitizedData.didNotBat ? 0 : 1),
            runs: (((_e = playerWithStats.battingStats) === null || _e === void 0 ? void 0 : _e.runs) || 0) + sanitizedData.runs,
            ballsFaced: (((_f = playerWithStats.battingStats) === null || _f === void 0 ? void 0 : _f.ballsFaced) || 0) +
                sanitizedData.ballsFaced,
            outs: (((_g = playerWithStats.battingStats) === null || _g === void 0 ? void 0 : _g.outs) || 0) + (isNotOut ? 0 : 1),
            highScore: sanitizedData.runs > (((_h = playerWithStats.battingStats) === null || _h === void 0 ? void 0 : _h.highScore) || 0)
                ? sanitizedData.runs
                : (_j = playerWithStats.battingStats) === null || _j === void 0 ? void 0 : _j.highScore,
        };
        // Prepare bowling stats update
        const bowlingUpdate = {
            matches: (((_k = playerWithStats.bowlingStats) === null || _k === void 0 ? void 0 : _k.matches) || 0) + 1,
            innings: (((_l = playerWithStats.bowlingStats) === null || _l === void 0 ? void 0 : _l.innings) || 0) +
                (sanitizedData.didNotBowl ? 0 : 1),
            wickets: (((_m = playerWithStats.bowlingStats) === null || _m === void 0 ? void 0 : _m.wickets) || 0) + sanitizedData.wickets,
            overs: (((_o = playerWithStats.bowlingStats) === null || _o === void 0 ? void 0 : _o.overs) || 0) + sanitizedData.overs,
            runsConceded: (((_p = playerWithStats.bowlingStats) === null || _p === void 0 ? void 0 : _p.runsConceded) || 0) +
                sanitizedData.runsConceded,
            bestBowling: newBestBowling,
        };
        // Perform updates
        yield db_1.db
            .update(schema_1.battingStats)
            .set(battingUpdate)
            .where((0, drizzle_orm_1.eq)(schema_1.battingStats.playerId, sanitizedData.id));
        yield db_1.db
            .update(schema_1.bowlingStats)
            .set(bowlingUpdate)
            .where((0, drizzle_orm_1.eq)(schema_1.bowlingStats.playerId, sanitizedData.id));
        res.status(200).json({ message: "Player stats updated successfully" });
    }
    catch (error) {
        console.error("Error updating player stats:", error);
        res
            .status(500)
            .json({ error: "An error occurred while updating player stats" });
    }
}));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
