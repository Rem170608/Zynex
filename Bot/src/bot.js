import { Client, IntentsBitField, REST, Routes } from 'discord.js';

// Import Commands
import { handleBanCommand } from './ban.js';
import { handleUnbanCommand } from './unban.js';
import { handleLockCommand } from './lock.js';
import { handleUnlockCommand } from './unlock.js';
import { handletimeoutCommand } from './timeout.js';
import { handleKickCommand } from './kick.js';
import { handleWarnCommand } from './warn.js';
import { handleClearCommand } from './clear.js';
import { handleSlowmodeCommand } from './slowmode.js';
import { handleUserInfoCommand } from './userinfo.js';
import { handleServerInfoCommand } from './serverinfo.js';
import { handleInfractionsCommand, handleClearInfractionsCommand } from './infractions.js';
import { handleAvatarCommand } from './avatar.js';
import { handleHelpCommand } from './help.js';
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
    {
        name: 'kick',
        description: 'Kick a user from the server',
        options: [
            {
                name: 'user',
                description: 'The user to kick',
                type: 6, // USER
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for kicking the user',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'warn',
        description: 'Warn a user',
        options: [
            {
                name: 'user',
                description: 'The user to warn',
                type: 6, // USER
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason for the warning',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'clear',
        description: 'Delete multiple messages',
        options: [
            {
                name: 'amount',
                description: 'Number of messages to delete (1-100)',
                type: 4, // INTEGER
                required: true,
            },
            {
                name: 'user',
                description: 'Only delete messages from this user',
                type: 6, // USER
                required: false,
            },
            {
                name: 'channel',
                description: 'Channel to clear messages from',
                type: 7, // CHANNEL
                required: false,
            },
        ],
    },
    {
        name: 'slowmode',
        description: 'Set slowmode for a channel',
        options: [
            {
                name: 'duration',
                description: 'Slowmode duration in seconds (0 to disable)',
                type: 4, // INTEGER
                required: true,
            },
            {
                name: 'channel',
                description: 'Channel to apply slowmode to',
                type: 7, // CHANNEL
                required: false,
            },
        ],
    },
    {
        name: 'userinfo',
        description: 'Get detailed information about a user',
        options: [
            {
                name: 'user',
                description: 'The user to get information about',
                type: 6, // USER
                required: false,
            },
        ],
    },
    {
        name: 'serverinfo',
        description: 'Get detailed information about this server',
        options: [],
    },
    {
        name: 'infractions',
        description: 'View a user\'s warnings and infractions',
        options: [
            {
                name: 'user',
                description: 'The user to check infractions for',
                type: 6, // USER
                required: false,
            },
        ],
    },
    {
        name: 'clear-infractions',
        description: 'Clear all warnings for a user',
        options: [
            {
                name: 'user',
                description: 'The user to clear warnings for',
                type: 6, // USER
                required: true,
            },
        ],
    },
    {
        name: 'avatar',
        description: 'Display a user\'s avatar',
        options: [
            {
                name: 'user',
                description: 'The user to show avatar for',
                type: 6, // USER
                required: false,
            },
        ],
    },
    {
        name: 'help',
        description: 'Show all available commands and help information',
        options: [],
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
    } else if (interaction.commandName === 'kick') {
        await handleKickCommand(interaction);
    } else if (interaction.commandName === 'warn') {
        await handleWarnCommand(interaction);
    } else if (interaction.commandName === 'clear') {
        await handleClearCommand(interaction);
    } else if (interaction.commandName === 'slowmode') {
        await handleSlowmodeCommand(interaction);
    } else if (interaction.commandName === 'userinfo') {
        await handleUserInfoCommand(interaction);
    } else if (interaction.commandName === 'serverinfo') {
        await handleServerInfoCommand(interaction);
    } else if (interaction.commandName === 'infractions') {
        await handleInfractionsCommand(interaction);
    } else if (interaction.commandName === 'clear-infractions') {
        await handleClearInfractionsCommand(interaction);
    } else if (interaction.commandName === 'avatar') {
        await handleAvatarCommand(interaction);
    } else if (interaction.commandName === 'help') {
        await handleHelpCommand(interaction);
    }
});


client.login(TOKEN);
