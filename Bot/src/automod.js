import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

// Auto-moderation function to be called on every message
export async function checkAutoMod(message, guildConfig) {
    if (!message.guild || message.author.bot) return;
    
    // Check if user has bypass permissions
    if (message.member && (
        message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
        message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )) {
        return;
    }

    const violations = [];
    const content = message.content;

    // Spam detection (basic)
    if (guildConfig.automod.antiSpam) {
        // Check for excessive repeated characters
        const repeatedCharPattern = /(.)\1{4,}/g;
        if (repeatedCharPattern.test(content)) {
            violations.push('excessive repeated characters');
        }

        // Check for too many capital letters
        if (content.length > 5) {
            const capsCount = (content.match(/[A-Z]/g) || []).length;
            const capsPercentage = (capsCount / content.length) * 100;
            if (capsPercentage > 70) {
                violations.push('excessive caps');
            }
        }

        // Check for too many emojis
        const emojiCount = (content.match(/:\w+:/g) || []).length + (content.match(/[\\u{1F600}-\\u{1F64F}]|[\u{1F300}-\\u{1F5FF}]|[\\u{1F680}-\\u{1F6FF}]|[\\u{1F700}-\\u{1F77F}]|[\\u{1F780}-\\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\\u{2600}-\\u{26FF}]|[\u{2700}-\\u{27BF}]/gu) || []).length;
        if (emojiCount > 5) {
            violations.push('excessive emojis');
        }

        // Check for excessive mentions
        const mentionCount = (content.match(/<@[!&]?\d+>/g) || []).length;
        if (mentionCount > 3) {
            violations.push('excessive mentions');
        }
    }

    // Bad words filter
    if (guildConfig.automod.badWords && guildConfig.automod.badWordsList) {
        const lowerContent = content.toLowerCase();
        for (const badWord of guildConfig.automod.badWordsList) {
            if (lowerContent.includes(badWord.toLowerCase())) {
                violations.push('inappropriate language');
                break;
            }
        }
    }

    // Discord invite detection
    if (guildConfig.automod.antiInvite) {
        const invitePattern = /discord\.gg\/[a-zA-Z0-9]+|discordapp\.com\/invite\/[a-zA-Z0-9]+/gi;
        if (invitePattern.test(content)) {
            violations.push('Discord invite');
        }
    }

    // Link detection
    if (guildConfig.automod.antiLink) {
        const linkPattern = /https?:\/\/[^\s]+/gi;
        if (linkPattern.test(content)) {
            violations.push('external link');
        }
    }

    // Take action if violations found
    if (violations.length > 0) {
        try {
            // Delete the message
            await message.delete();

            // Take action based on configuration
            let actionTaken = 'Message deleted';
            
            if (guildConfig.automod.action === 'timeout' && message.member.moderatable) {
                await message.member.timeout(5 * 60 * 1000, `Auto-mod: ${violations.join(', ')}`);
                actionTaken = 'Message deleted, user timed out for 5 minutes';
            } else if (guildConfig.automod.action === 'warn') {
                // Add a warning
                if (!guildConfig.warnings) guildConfig.warnings = {};
                if (!guildConfig.warnings[message.author.id]) guildConfig.warnings[message.author.id] = [];
                
                guildConfig.warnings[message.author.id].push({
                    id: Date.now().toString(),
                    reason: `Auto-mod: ${violations.join(', ')}`,
                    moderator: message.client.user.id,
                    timestamp: Date.now()
                });
                
                await configManager.updateGuildConfig(message.guild.id, { warnings: guildConfig.warnings });
                actionTaken = 'Message deleted, warning issued';
            }

            // Log the auto-mod action
            if (guildConfig.moderation.logActions && guildConfig.logChannel) {
                const logChannel = message.guild.channels.cache.get(guildConfig.logChannel);
                if (logChannel && logChannel.isTextBased()) {
                    await logChannel.send(
                        `🤖 **Auto-Mod Action:** ${actionTaken}\n**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Violations:** ${violations.join(', ')}\n**Message:** \`${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\`\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    );
                }
            }

            // Send a warning to the user if configured
            if (guildConfig.automod.sendWarning) {
                try {
                    await message.author.send(
                        `⚠️ **Your message in ${message.guild.name} was automatically removed**\n**Reason:** ${violations.join(', ')}\n**Action:** ${actionTaken}`
                    );
                } catch (error) {
                    // User might have DMs disabled
                }
            }

        } catch (error) {
            console.error('Auto-mod error:', error);
        }
    }
}