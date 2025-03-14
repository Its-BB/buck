const express = require('express');
const noblox = require('noblox.js');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;

const GROUP_ID = 35737951; 
const ROBLOX_COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BE5DD6CABB0E6C2D317AB5B32EF66E6246E3C3ADBED94DD6D5E70A1DEC0645881F8E9AF97DED1D15D689B4EFFF5A6C12E97E2816AFB4EEDBF8625DCB956B05ECA5AD292927982FC05E24284D7B3171B54731B907F7D9A5C815FCB1C9654A0056DE51F891166A5DE797A1EDBA4C33FDE4E925DDA2C824836FDF6C484A1DD2D8829A0F911E0D953748D45832ED76242E40C55E3AFAF340D0E5AAC4CEF2D6EF7F7EAB9AD9BF7C4A4D57D627FE18AE2B4CCC62EF6657DDDDD4E129C683B019CFC77FB4C6ADE42BC8BBFF41BB5AC979B9E16E08322A92BFF209482350F92E936963514EB6C36660738F329796DAFA3D8F7FC324C69D852EAE541053B9F0EC7AFB107FD561A1270BA4A65CAC8259F1E374626632FA710CB173E6D870448C2BB9113BBE5E9EC45DCBFD770F8423CEC88A9E5606378B76DC415A930A5D2399D7DC72B28DADAA3B476B98ADF50F62E4C00AF015290517F15FA93B7F9F73A1870B894023BFC0B49296537D1CFB21944A06452E00B0BF21137B76F95746AA0AFCBBEC8C989A20C43EF1B6499AFD549638F6FB147E497F711A2CCB7F4A1B99B7AC2C8C1DB6D47774CB699737566884FC55DF62D96AD5EB7750B0C08683357A88CCA93B1E2885F41733A621BEC3A245976F17BEB2F8C7B999900A4AB8C7D9DF771063854C34537C3D2F03DB298F37382C144F4C9D3E8DA84400D84ECC262520DE23D1899D7CB272AA6B5C2F822AD3EF56E3708F4DEBD18B867AA3D41C189AFA2E10205018CA5C3B7E9F28F547D73F644038C69D55FD5EF1696B9BC24EAC2350F111B110A5FA948F03967FC46B7947106F89A6F76E477E2811824B178296113FB618FB4B290E54A9C74B7F284C3E95E11E0DEB40DE3E7FB456E5C9E09C9E6DE43A94E7785C8ABC027395A66739237F52FA385C89C7C1073B830CA3559EA97517C95A7B8DB193914CF09357C1288B0DF9F9A770D22175A2E0F412EA1FC99C427C0C906D58DFA7D5E231710A7FCE98A323BBD5D37566EAC360D7B0793C674A4B97B0F338E06FE6F288B5C3070BF2B4AA9614C058C027B6CBFA4573150332D9D865E66072B422317FC5E1AD61DF0D0EE8AF21EA593BA359B765EAC8F6";
const LOG_FILE = 'promotion_log.json';

const rankMap = {
    0: 1,    // Greenhorn - Replace with actual ID
    2: 2,    // Tenderfoot - Replace with actual ID
    5: 3,    // Bronc - Replace with actual ID
    15: 4,   // Hombre - Replace with actual ID
    35: 5,   // Cowpuncher - Replace with actual ID
    40: 6,   // Ranch Hand - Replace with actual ID
    75: 7,   // Roper - Replace with actual ID
    125: 8,  // Wrangler - Replace with actual ID
    175: 9,  // Rustler - Replace with actual ID
    250: 10, // Range Rider - Replace with actual ID
    350: 11, // Trail Boss - Replace with actual ID
    500: 12, // Buckaroo - Replace with actual ID
    750: 13, // Saddle Tramp - Replace with actual ID
    1050: 14 // Lone Star - Replace with actual ID
};

app.use(express.json());

async function login() {
    try {
        await noblox.setCookie(ROBLOX_COOKIE);
        console.log("Successfully logged into Roblox bot account");
    } catch (err) {
        console.error("Failed to log in:", err);
    }
}

async function loadLog() {
    try {
        const data = await fs.readFile(LOG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return { failedPromotions: [], notInGroup: [] };
        }
        console.error("Error loading log:", err);
        return { failedPromotions: [], notInGroup: [] };
    }
}

async function saveLog(logData) {
    try {
        await fs.writeFile(LOG_FILE, JSON.stringify(logData, null, 2));
        console.log("Log saved successfully");
    } catch (err) {
        console.error("Error saving log:", err);
    }
}

app.post('/promote', async (req, res) => {
    const { userId, honor } = req.body;
    console.log(`Received: userId=${userId}, honor=${honor}`);

    if (!userId || !honor) {
        return res.status(400).send("Missing userId or honor");
    }

    const logData = await loadLog();
    let newRankId = 1;

    for (const [honorThreshold, rankId] of Object.entries(rankMap).sort((a, b) => b[0] - a[0])) {
        if (honor >= parseInt(honorThreshold)) {
            newRankId = rankId;
            break;
        }
    }
    console.log(`Mapped honor ${honor} to rankId: ${newRankId}`);

    try {
        const role = await noblox.getRole(GROUP_ID, userId);
        if (!role) {
            logData.notInGroup.push({
                userId: userId,
                honor: honor,
                rankId: newRankId,
                timestamp: new Date().toISOString()
            });
            await saveLog(logData);
            console.log(`User ${userId} not in group, logged for later`);
            return res.status(200).send("User not in group, logged");
        }

        await noblox.setRank(GROUP_ID, userId, newRankId);
        console.log(`Promoted user ${userId} to rank ${newRankId} with ${honor} honor`);
        res.status(200).send("Promotion successful");
    } catch (err) {
        console.error(`Failed to promote user ${userId}:`, err.message);
        logData.failedPromotions.push({
            userId: userId,
            honor: honor,
            rankId: newRankId,
            error: err.message,
            timestamp: new Date().toISOString()
        });
        await saveLog(logData);
        res.status(500).send("Promotion failed, logged");
    }
});

login().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});