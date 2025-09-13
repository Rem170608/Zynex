import express from 'express';
import cors from 'cors';
import { Client, IntentsBitField } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Check if Discord token is provided
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required but not found!');
    process.exit(1);
}

// Create Discord client for API calls
const apiClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
    ],
});

// Login the API client
apiClient.login(TOKEN).catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes
app.get('/api/bot/status', (req, res) => {
    res.json({
        online: apiClient.isReady(),
        username: apiClient.user?.username || 'Unknown',
        id: apiClient.user?.id || 'Unknown',
        guilds: apiClient.guilds.cache.size
    });
});

app.get('/api/bot/guilds', (req, res) => {
    if (!apiClient.isReady()) {
        return res.status(503).json({ error: 'Bot is not ready' });
    }

    const guilds = apiClient.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: guild.iconURL(),
        owner: guild.ownerId === apiClient.user.id,
        permissions: guild.members.me?.permissions.toArray() || []
    }));

    res.json(guilds);
});

app.get('/api/bot/guild/:guildId', (req, res) => {
    const { guildId } = req.params;
    const guild = apiClient.guilds.cache.get(guildId);
    
    if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        icon: guild.iconURL(),
        owner: guild.ownerId === apiClient.user.id,
        channels: guild.channels.cache
            .filter(channel => channel.isTextBased())
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type
            })),
        roles: guild.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            permissions: role.permissions.toArray()
        }))
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Dashboard server running on http://0.0.0.0:${PORT}`);
});