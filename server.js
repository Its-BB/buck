const express = require('express');
const noblox = require('noblox.js');
const app = express();

const PORT = process.env.PORT || 3000;

const GROUP_ID = 35737951;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

const rankMap = {
    0: 1,    // Greenhorn
    2: 2,    // Tenderfoot
    5: 3,    // Bronc
    15: 4,   // Hombre (confirmed ID 4)
    35: 5,   // Cowpuncher
    40: 6,   // Ranch Hand
    75: 7,   // Roper
    125: 8,  // Wrangler
    175: 9,  // Rustler
    250: 10, // Range Rider
    350: 11, // Trail Boss
    500: 12, // Buckaroo
    750: 13, // Saddle Tramp
    1050: 14 // Lone Star
};

app.use(express.json());

async function login() {
    try {
        if (!ROBLOX_COOKIE) {
            throw new Error("ROBLOX_COOKIE environment variable is not set");
        }
        await noblox.setCookie(ROBLOX_COOKIE);
        console.log("Successfully logged into Roblox bot account");
    } catch (err) {
        console.error("Failed to log in:", err.message);
    }
}

app.post('/promote', async (req, res) => {
    const { userId, honor } = req.body;
    console.log(`Received: userId=${userId}, honor=${honor}`);

    if (!userId || !honor) {
        return res.status(400).send("Missing userId or honor");
    }

    try {
        let newRankId = 1;
        for (const [honorThreshold, rankId] of Object.entries(rankMap).sort((a, b) => b[0] - a[0])) {
            if (honor >= parseInt(honorThreshold)) {
                newRankId = rankId;
                break;
            }
        }
        console.log(`Mapped honor ${honor} to rankId: ${newRankId}`);

        await noblox.setRank(GROUP_ID, userId, newRankId);
        console.log(`Promoted user ${userId} to rank ${newRankId} with ${honor} honor`);
        res.status(200).send("Promotion successful");
    } catch (err) {
        console.error(`Failed to promote user ${userId}:`, err.message);
        res.status(500).send("Promotion failed");
    }
});

login().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});