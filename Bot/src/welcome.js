import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { configManager } from '../../shared/config.js';

// Handle member join event
export async function handleMemberJoin(member, guildConfig) {
    if (!guildConfig.features.welcome || !guildConfig.welcome.enabled) return;

    try {
        const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcome.channelId);
        if (!welcomeChannel || !welcomeChannel.isTextBased()) return;

        // Replace placeholders in welcome message
        let message = guildConfig.welcome.message || 'Welcome {user} to {server}!';
        message = message
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{server}/g, member.guild.name)
            .replace(/{membercount}/g, member.guild.memberCount.toString());

        if (guildConfig.welcome.embedEnabled) {
            const embed = new EmbedBuilder()
                .setColor(guildConfig.welcome.embedColor || '#00FF00')
                .setTitle(guildConfig.welcome.embedTitle || '👋 Welcome!')
                .setDescription(message)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `User ID: ${member.id}` })
                .setTimestamp();

            if (guildConfig.welcome.embedImage) {
                embed.setImage(guildConfig.welcome.embedImage);
            }

            await welcomeChannel.send({ embeds: [embed] });
        } else {
            await welcomeChannel.send(message);
        }

        // Give autorole if configured
        if (guildConfig.welcome.autoRole) {
            const role = member.guild.roles.cache.get(guildConfig.welcome.autoRole);
            if (role && role.editable && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    
                    // Log autorole
                    if (guildConfig.moderation.logActions && guildConfig.logChannel) {
                        const logChannel = member.guild.channels.cache.get(guildConfig.logChannel);
                        if (logChannel && logChannel.isTextBased()) {
                            await logChannel.send(
                                `🎯 **Auto-role assigned:** ${role} to ${member.user.tag} (${member.id}) on join`
                            );
                        }
                    }
                } catch (error) {
                    console.error('Failed to assign auto-role:', error);
                }
            }
        }

        // Send welcome DM if configured
        if (guildConfig.welcome.dmEnabled && guildConfig.welcome.dmMessage) {
            try {
                let dmMessage = guildConfig.welcome.dmMessage
                    .replace(/{user}/g, member.user.username)
                    .replace(/{server}/g, member.guild.name);

                await member.send(dmMessage);
            } catch (error) {
                // User might have DMs disabled
            }
        }

    } catch (error) {
        console.error('Welcome system error:', error);
    }
}

// Handle member leave event
export async function handleMemberLeave(member, guildConfig) {
    if (!guildConfig.features.goodbye || !guildConfig.goodbye.enabled) return;

    try {
        const goodbyeChannel = member.guild.channels.cache.get(guildConfig.goodbye.channelId);
        if (!goodbyeChannel || !goodbyeChannel.isTextBased()) return;

        // Replace placeholders in goodbye message
        let message = guildConfig.goodbye.message || '{user} has left {server}. Goodbye!';
        message = message
            .replace(/{user}/g, member.user.tag)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name)
            .replace(/{membercount}/g, member.guild.memberCount.toString());

        if (guildConfig.goodbye.embedEnabled) {
            const embed = new EmbedBuilder()
                .setColor(guildConfig.goodbye.embedColor || '#FF0000')
                .setTitle(guildConfig.goodbye.embedTitle || '👋 Goodbye!')
                .setDescription(message)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true },
                    { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true }
                )
                .setFooter({ text: `User ID: ${member.id}` })
                .setTimestamp();

            if (guildConfig.goodbye.embedImage) {
                embed.setImage(guildConfig.goodbye.embedImage);
            }

            await goodbyeChannel.send({ embeds: [embed] });
        } else {
            await goodbyeChannel.send(message);
        }

    } catch (error) {
        console.error('Goodbye system error:', error);
    }
}