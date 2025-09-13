import { EmbedBuilder } from 'discord.js';
import { configManager } from '../../shared/config.js';

// XP calculation functions
function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100));
}

function calculateXPForLevel(level) {
    return Math.pow(level, 2) * 100;
}

function getRandomXP() {
    return Math.floor(Math.random() * 15) + 15; // 15-30 XP per message
}

// Add XP to user (called on message events)
export async function addXP(message, guildConfig) {
    if (!message.guild || message.author.bot) return;
    
    // Check if leveling is enabled
    if (!guildConfig.features.leveling) return;

    // Check if channel is excluded
    if (guildConfig.leveling.excludedChannels && guildConfig.leveling.excludedChannels.includes(message.channel.id)) {
        return;
    }

    // Check if user has excluded role
    if (guildConfig.leveling.excludedRoles && message.member) {
        const hasExcludedRole = message.member.roles.cache.some(role => 
            guildConfig.leveling.excludedRoles.includes(role.id)
        );
        if (hasExcludedRole) return;
    }

    // Initialize leveling data if not exists
    if (!guildConfig.leveling) {
        guildConfig.leveling = {
            users: {},
            multiplier: 1,
            excludedChannels: [],
            excludedRoles: [],
            roleRewards: {}
        };
    }

    if (!guildConfig.leveling.users) {
        guildConfig.leveling.users = {};
    }

    const userId = message.author.id;
    const userData = guildConfig.leveling.users[userId] || { xp: 0, level: 0, lastMessage: 0 };

    // Cooldown check (prevent spam)
    const now = Date.now();
    if (now - userData.lastMessage < 60000) return; // 1 minute cooldown

    // Add XP
    const xpGain = Math.floor(getRandomXP() * (guildConfig.leveling.multiplier || 1));
    userData.xp += xpGain;
    userData.lastMessage = now;

    // Check for level up
    const newLevel = calculateLevel(userData.xp);
    const leveledUp = newLevel > userData.level;
    userData.level = newLevel;

    // Save data
    guildConfig.leveling.users[userId] = userData;
    await configManager.updateGuildConfig(message.guild.id, { leveling: guildConfig.leveling });

    // Handle level up
    if (leveledUp) {
        // Send level up message if configured
        if (guildConfig.leveling.announceChannel) {
            const announceChannel = message.guild.channels.cache.get(guildConfig.leveling.announceChannel);
            if (announceChannel && announceChannel.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎉 Level Up!')
                    .setDescription(`${message.author} reached level **${newLevel}**!`)
                    .addFields({ name: 'XP', value: userData.xp.toLocaleString(), inline: true })
                    .setThumbnail(message.author.displayAvatarURL())
                    .setTimestamp();

                await announceChannel.send({ embeds: [embed] });
            }
        }

        // Give role rewards if configured
        if (guildConfig.leveling.roleRewards && guildConfig.leveling.roleRewards[newLevel] && message.member) {
            const roleId = guildConfig.leveling.roleRewards[newLevel];
            const role = message.guild.roles.cache.get(roleId);
            if (role && role.editable && !message.member.roles.cache.has(roleId)) {
                try {
                    await message.member.roles.add(role);
                    
                    // Log role reward
                    if (guildConfig.moderation.logActions && guildConfig.logChannel) {
                        const logChannel = message.guild.channels.cache.get(guildConfig.logChannel);
                        if (logChannel && logChannel.isTextBased()) {
                            await logChannel.send(
                                `🎯 **Level Role Reward:** ${role} given to ${message.author.tag} for reaching level ${newLevel}`
                            );
                        }
                    }
                } catch (error) {
                    console.error('Failed to give level role reward:', error);
                }
            }
        }
    }
}

// Rank command
export async function handleRankCommand(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

        if (!guildConfig.features.leveling) {
            return await interaction.reply({ content: 'Leveling system is disabled in this server.', ephemeral: true });
        }

        const userData = guildConfig.leveling?.users?.[user.id];
        if (!userData) {
            return await interaction.reply({ 
                content: `${user.tag} has no XP data. Send some messages to start gaining XP!`,
                ephemeral: true 
            });
        }

        // Calculate rank
        const allUsers = Object.entries(guildConfig.leveling.users)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.xp - a.xp);
        
        const rank = allUsers.findIndex(u => u.id === user.id) + 1;
        const nextLevelXP = calculateXPForLevel(userData.level + 1);
        const currentLevelXP = calculateXPForLevel(userData.level);
        const progress = userData.xp - currentLevelXP;
        const needed = nextLevelXP - userData.xp;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${user.tag}'s Rank`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Level', value: userData.level.toString(), inline: true },
                { name: 'XP', value: userData.xp.toLocaleString(), inline: true },
                { name: 'Rank', value: `#${rank}`, inline: true },
                { name: 'Progress to Next Level', value: `${progress}/${nextLevelXP - currentLevelXP} (${needed} XP needed)`, inline: false }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching rank information.',
            ephemeral: true,
        });
    }
}

// Leaderboard command
export async function handleLeaderboardCommand(interaction) {
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

        if (!guildConfig.features.leveling) {
            return await interaction.reply({ content: 'Leveling system is disabled in this server.', ephemeral: true });
        }

        if (!guildConfig.leveling?.users || Object.keys(guildConfig.leveling.users).length === 0) {
            return await interaction.reply({ content: 'No leveling data found for this server.', ephemeral: true });
        }

        // Get top 10 users
        const topUsers = Object.entries(guildConfig.leveling.users)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
            .setDescription('Top 10 most active members')
            .setTimestamp();

        const leaderboard = await Promise.all(topUsers.map(async (userData, index) => {
            try {
                const user = await interaction.client.users.fetch(userData.id);
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${user.tag}**\nLevel ${userData.level} • ${userData.xp.toLocaleString()} XP`;
            } catch (error) {
                return `${index + 1}. Unknown User\nLevel ${userData.level} • ${userData.xp.toLocaleString()} XP`;
            }
        }));

        embed.addFields({ name: 'Rankings', value: leaderboard.join('\n\n'), inline: false });

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching the leaderboard.',
            ephemeral: true,
        });
    }
}