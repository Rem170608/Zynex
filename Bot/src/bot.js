import { Client, IntentsBitField, REST, Routes } from 'discord.js';

// Import Commands
import { handleBanCommand } from './ban.js'; // Import the ban command handler
import { handleUnbanCommand } from './unban.js'; // Import the unban command handler
import { handleLockCommand } from './lock.js'; // Import the lock command handler
import { handleUnlockCommand } from './unlock.js'; // Import the unlock command handler
import { handletimeoutCommand } from './timeout.js';
// Use environment variable for Discord bot token
const TOKEN = process.env.DISCORD_TOKEN;

// Check if Discord token is provided
if (!TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required but not found!');
    console.error('Please add your Discord bot token to the environment variables.');
    process.exit(1);
}


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

// Token and client ID
const CLIENT_ID = '1252654640399650937';

// Register the /ban, /unban, and /logchannel commands
const commands = [
    {
        name: 'ban',
        description: 'Ban a user from the server.',
        options: [
            {
                name: 'user',
                description: 'The user to ban.',
                type: 6, // User type
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for banning the user.',
                type: 3, // String type
                required: false,
            },
        ],
    },
    {
        name: 'unban',
        description: 'Unban a user from the server.',
        options: [
            {
                name: 'user_id', // Change name to clarify it's an ID
                description: 'The ID of the user to unban.',
                type: 3, // String type (for ID)
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for unbanning the user.',
                type: 3, // String type
                required: false,
            },
        ],
    },
    {
        name: 'lock',
        description: 'Lock a specific channel.',
        options: [
            {
                name: 'channel',
                description: 'Channel to lock.',
                type: 7, // Channel type
                required: true,
            },
        ],
    },
    {
        name: 'unlock',
        description: 'Unlock a specific channel',
        options: [
            {
                name: 'channel',
                description: 'Channel to unlock',
                type: 7, // Channel type
                required: true,
            },
        ],
    },
    {
        name: 'timeout',
        description: 'Timeout a user',
        options: [
            {
                name: 'user',
                description: 'The user to timeout',
                type: 6, // USER
                required: true,
            },
            {
                name: 'duration',
                description: 'Duration of the timeout in minutes',
                type: 4, // INTEGER
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for the timeout',
                type: 3, // STRING
                required: false,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Bot ready event
client.on('ready', (c) => {
    console.log(`${c.user.tag} is online!`);
});

// Handle interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ban') {
        await handleBanCommand(interaction);
    } else if (interaction.commandName === 'unban') {
        await handleUnbanCommand(interaction);
    } else if (interaction.commandName === 'lock') {
        await handleLockCommand(interaction);
    } else if (interaction.commandName === 'unlock') {
        await handleUnlockCommand(interaction);
    } else if (interaction.commandName === 'timeout') {
        await handletimeoutCommand(interaction);
    }
});


client.login(TOKEN);
