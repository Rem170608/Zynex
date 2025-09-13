class DiscordBotDashboard {
    constructor() {
        this.apiBase = '';
        this.currentGuild = null;
        this.init();
    }

    async init() {
        await this.loadBotStatus();
        await this.loadGuilds();
    }

    async loadBotStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/status`);
            const data = await response.json();
            
            this.updateBotStatus(data);
        } catch (error) {
            console.error('Failed to load bot status:', error);
            this.showError('Failed to load bot status');
        }
    }

    updateBotStatus(data) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const botName = document.getElementById('bot-name');
        const botId = document.getElementById('bot-id');
        const guildCount = document.getElementById('guild-count');

        if (data.online) {
            statusDot.classList.add('online');
            statusText.textContent = 'Online';
        } else {
            statusDot.classList.remove('online');
            statusText.textContent = 'Offline';
        }

        botName.textContent = data.username;
        botId.textContent = data.id;
        guildCount.textContent = data.guilds;
    }

    async loadGuilds() {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guilds`);
            const guilds = await response.json();
            
            this.displayGuilds(guilds);
        } catch (error) {
            console.error('Failed to load guilds:', error);
            this.showError('Failed to load servers');
        }
    }

    displayGuilds(guilds) {
        const serversGrid = document.getElementById('servers-grid');
        
        if (guilds.length === 0) {
            serversGrid.innerHTML = '<div class="loading">No servers found</div>';
            return;
        }

        serversGrid.innerHTML = guilds.map(guild => `
            <div class="server-card" onclick="dashboard.viewServerDetails('${guild.id}')">
                <div class="server-header">
                    <div class="server-icon">
                        ${guild.icon ? `<img src="${guild.icon}" alt="${guild.name}">` : guild.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="server-name">${this.escapeHtml(guild.name)}</div>
                </div>
                <div class="server-stats">
                    <span>👥 ${guild.memberCount || 'Unknown'} members</span>
                    <span>${guild.owner ? '👑 Owner' : '🤖 Member'}</span>
                </div>
            </div>
        `).join('');
    }

    async viewServerDetails(guildId) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${guildId}`);
            const guild = await response.json();
            
            this.currentGuild = guild;
            this.displayServerDetails(guild);
            this.showTab('info');
        } catch (error) {
            console.error('Failed to load server details:', error);
            this.showError('Failed to load server details');
        }
    }

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="dashboard.showTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tab-${tabName}`).style.display = 'block';

        // Load content based on tab
        if (tabName === 'config' && this.currentGuild) {
            this.displayServerConfig(this.currentGuild);
        } else if (tabName === 'messaging' && this.currentGuild) {
            this.displayMessagingInterface(this.currentGuild);
        }
    }

    displayServerDetails(guild) {
        const serverDetails = document.getElementById('server-details');
        const serverInfo = document.getElementById('server-info');
        const serverTitle = document.getElementById('server-details-title');
        
        serverTitle.textContent = `${guild.name} - Management`;

        serverInfo.innerHTML = `
            <div class="info-grid">
                <div class="info-card">
                    <h3>Server Name</h3>
                    <p>${this.escapeHtml(guild.name)}</p>
                </div>
                <div class="info-card">
                    <h3>Members</h3>
                    <p>${guild.memberCount || 'Unknown'}</p>
                </div>
                <div class="info-card">
                    <h3>Text Channels</h3>
                    <p>${guild.channels?.length || 0}</p>
                </div>
                <div class="info-card">
                    <h3>Roles</h3>
                    <p>${guild.roles?.length || 0}</p>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>Text Channels</h3>
                <div class="channels-list">
                    ${guild.channels?.map(channel => `
                        <div class="channel-item" style="padding: 5px 0; color: #666;">
                            # ${this.escapeHtml(channel.name)}
                        </div>
                    `).join('') || '<p>No channels found</p>'}
                </div>
            </div>
        `;
        
        serverDetails.style.display = 'block';
        serverDetails.scrollIntoView({ behavior: 'smooth' });
    }

    displayServerConfig(guild) {
        const serverConfig = document.getElementById('server-config');
        const config = guild.config;

        serverConfig.innerHTML = `
            <div class="config-section">
                <h3>🛡️ Moderation Commands</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Enable Ban Command</label>
                        <div class="config-toggle ${config.moderation.banEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'banEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Kick Command</label>
                        <div class="config-toggle ${config.moderation.kickEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'kickEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Timeout Command</label>
                        <div class="config-toggle ${config.moderation.timeoutEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'timeoutEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Warn Command</label>
                        <div class="config-toggle ${config.moderation.warnEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'warnEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Clear Command</label>
                        <div class="config-toggle ${config.moderation.clearEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'clearEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Lock Commands</label>
                        <div class="config-toggle ${config.moderation.lockEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'lockEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Slowmode Command</label>
                        <div class="config-toggle ${config.moderation.slowmodeEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'slowmodeEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Role Commands</label>
                        <div class="config-toggle ${config.moderation.roleEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'roleEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Enable Set Nickname Command</label>
                        <div class="config-toggle ${config.moderation.setNickEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'setNickEnabled', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Log Moderation Actions</label>
                        <div class="config-toggle ${config.moderation.logActions ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'logActions', this)"></div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <h3>⚠️ Warning System</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Auto-Actions on Max Warnings</label>
                        <div class="config-toggle ${config.moderation.autoWarnActions ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('moderation', 'autoWarnActions', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Max Warnings Before Action</label>
                        <input type="number" class="config-select" value="${config.moderation.maxWarnings || 3}" 
                               min="1" max="10" onchange="dashboard.updateConfigValue('moderation', 'maxWarnings', parseInt(this.value))">
                    </div>
                    <div class="config-item">
                        <label>Warning Action</label>
                        <select class="config-select" onchange="dashboard.updateConfigValue('moderation', 'warnAction', this.value)">
                            <option value="timeout" ${config.moderation.warnAction === 'timeout' ? 'selected' : ''}>Timeout (24h)</option>
                            <option value="kick" ${config.moderation.warnAction === 'kick' ? 'selected' : ''}>Kick from Server</option>
                            <option value="none" ${config.moderation.warnAction === 'none' ? 'selected' : ''}>No Action</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <h3>📝 Logging Configuration</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Log Channel</label>
                        <select class="config-select" onchange="dashboard.updateLogChannel(this.value)">
                            <option value="">Select a channel...</option>
                            ${guild.channels.map(channel => `
                                <option value="${channel.id}" ${config.logChannel === channel.id ? 'selected' : ''}>
                                    # ${this.escapeHtml(channel.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <h3>⭐ Leveling System</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Enable Leveling System</label>
                        <div class="config-toggle ${config.features.leveling ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('features', 'leveling', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Level Announcements Channel</label>
                        <select class="config-select" onchange="dashboard.updateLevelingChannel(this.value)">
                            <option value="">Select a channel...</option>
                            ${guild.channels.map(channel => `
                                <option value="${channel.id}" ${config.leveling?.announceChannel === channel.id ? 'selected' : ''}>
                                    # ${this.escapeHtml(channel.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="config-item">
                        <label>XP Multiplier</label>
                        <input type="number" class="config-select" value="${config.leveling?.multiplier || 1}" 
                               min="0.1" max="5" step="0.1" onchange="dashboard.updateLevelingMultiplier(parseFloat(this.value))">
                    </div>
                </div>
            </div>

            <div class="config-section">
                <h3>🛡️ Auto-Moderation</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Enable Auto-Moderation</label>
                        <div class="config-toggle ${config.features.automod ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('features', 'automod', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Anti-Spam Detection</label>
                        <div class="config-toggle ${config.automod?.antiSpam ? 'active' : ''}" 
                             onclick="dashboard.toggleAutomod('antiSpam', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Block Discord Invites</label>
                        <div class="config-toggle ${config.automod?.antiInvite ? 'active' : ''}" 
                             onclick="dashboard.toggleAutomod('antiInvite', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Block External Links</label>
                        <div class="config-toggle ${config.automod?.antiLink ? 'active' : ''}" 
                             onclick="dashboard.toggleAutomod('antiLink', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Bad Words Filter</label>
                        <div class="config-toggle ${config.automod?.badWords ? 'active' : ''}" 
                             onclick="dashboard.toggleAutomod('badWords', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Auto-Mod Action</label>
                        <select class="config-select" onchange="dashboard.updateAutomodAction(this.value)">
                            <option value="delete" ${config.automod?.action === 'delete' ? 'selected' : ''}>Delete Message</option>
                            <option value="timeout" ${config.automod?.action === 'timeout' ? 'selected' : ''}>Timeout User</option>
                            <option value="warn" ${config.automod?.action === 'warn' ? 'selected' : ''}>Issue Warning</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <h3>👋 Welcome Messages</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Enable Welcome Messages</label>
                        <div class="config-toggle ${config.features.welcome ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('features', 'welcome', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Welcome Channel</label>
                        <select class="config-select" onchange="dashboard.updateWelcomeChannel(this.value)">
                            <option value="">Select a channel...</option>
                            ${guild.channels.map(channel => `
                                <option value="${channel.id}" ${config.welcome?.channelId === channel.id ? 'selected' : ''}>
                                    # ${this.escapeHtml(channel.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="config-item">
                        <label>Use Embed for Welcome</label>
                        <div class="config-toggle ${config.welcome?.embedEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleWelcome('embedEnabled', this)"></div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <label>Welcome Message (Use {user}, {server}, {membercount})</label>
                    <textarea placeholder="Welcome {user} to {server}!" 
                              onchange="dashboard.updateWelcomeMessage(this.value)"
                              style="width: 100%; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${config.welcome?.message || 'Welcome {user} to {server}!'}</textarea>
                </div>
            </div>

            <div class="config-section">
                <h3>👋 Goodbye Messages</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <label>Enable Goodbye Messages</label>
                        <div class="config-toggle ${config.features.goodbye ? 'active' : ''}" 
                             onclick="dashboard.toggleConfig('features', 'goodbye', this)"></div>
                    </div>
                    <div class="config-item">
                        <label>Goodbye Channel</label>
                        <select class="config-select" onchange="dashboard.updateGoodbyeChannel(this.value)">
                            <option value="">Select a channel...</option>
                            ${guild.channels.map(channel => `
                                <option value="${channel.id}" ${config.goodbye?.channelId === channel.id ? 'selected' : ''}>
                                    # ${this.escapeHtml(channel.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="config-item">
                        <label>Use Embed for Goodbye</label>
                        <div class="config-toggle ${config.goodbye?.embedEnabled ? 'active' : ''}" 
                             onclick="dashboard.toggleGoodbye('embedEnabled', this)"></div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <label>Goodbye Message (Use {user}, {server}, {membercount})</label>
                    <textarea placeholder="{user} has left {server}. Goodbye!" 
                              onchange="dashboard.updateGoodbyeMessage(this.value)"
                              style="width: 100%; margin-top: 5px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${config.goodbye?.message || '{user} has left {server}. Goodbye!'}</textarea>
                </div>
            </div>
        `;
    }

    displayMessagingInterface(guild) {
        const serverMessaging = document.getElementById('server-messaging');

        serverMessaging.innerHTML = `
            <div class="messaging-form">
                <h3>📤 Send Message to Channel</h3>
                <form onsubmit="dashboard.sendMessage(event)">
                    <div class="form-group">
                        <label>Channel</label>
                        <select id="message-channel" required>
                            <option value="">Select a channel...</option>
                            ${guild.channels.map(channel => `
                                <option value="${channel.id}"># ${this.escapeHtml(channel.name)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea id="message-content" placeholder="Enter your message here..." required></textarea>
                    </div>
                    <button type="submit" class="btn" id="send-btn">Send Message</button>
                </form>
                <div id="message-result"></div>
            </div>
        `;
    }

    async toggleConfig(section, key, element) {
        const isActive = element.classList.contains('active');
        const newValue = !isActive;

        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/${section}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newValue })
            });

            if (response.ok) {
                element.classList.toggle('active');
                this.currentGuild.config[section][key] = newValue;
            } else {
                throw new Error('Failed to update configuration');
            }
        } catch (error) {
            console.error('Error updating config:', error);
            this.showError('Failed to update configuration');
        }
    }

    async updateLogChannel(channelId) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logChannel: channelId || null })
            });

            if (response.ok) {
                this.currentGuild.config.logChannel = channelId || null;
            } else {
                throw new Error('Failed to update log channel');
            }
        } catch (error) {
            console.error('Error updating log channel:', error);
            this.showError('Failed to update log channel');
        }
    }

    async updateWelcomeChannel(channelId) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ welcomeChannel: channelId || null })
            });

            if (response.ok) {
                this.currentGuild.config.welcomeChannel = channelId || null;
            } else {
                throw new Error('Failed to update welcome channel');
            }
        } catch (error) {
            console.error('Error updating welcome channel:', error);
            this.showError('Failed to update welcome channel');
        }
    }

    async updateConfigValue(section, key, value) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/${section}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });

            if (response.ok) {
                this.currentGuild.config[section][key] = value;
            } else {
                throw new Error('Failed to update configuration');
            }
        } catch (error) {
            console.error('Error updating config value:', error);
            this.showError('Failed to update configuration');
        }
    }

    async updateWelcomeMessage(message) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ welcomeMessage: message })
            });

            if (response.ok) {
                this.currentGuild.config.welcomeMessage = message;
            } else {
                throw new Error('Failed to update welcome message');
            }
        } catch (error) {
            console.error('Error updating welcome message:', error);
            this.showError('Failed to update welcome message');
        }
    }

    async sendMessage(event) {
        event.preventDefault();
        
        const channelId = document.getElementById('message-channel').value;
        const message = document.getElementById('message-content').value;
        const sendBtn = document.getElementById('send-btn');
        const resultDiv = document.getElementById('message-result');

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, message })
            });

            const result = await response.json();

            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="success-message">
                        ✅ Message sent successfully to # ${this.escapeHtml(result.channelName)}
                    </div>
                `;
                document.getElementById('message-content').value = '';
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            resultDiv.innerHTML = `
                <div class="error">
                    ❌ Failed to send message: ${error.message}
                </div>
            `;
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Message';
        }
    }

    showError(message) {
        const serversGrid = document.getElementById('servers-grid');
        serversGrid.innerHTML = `<div class="error">${message}</div>`;
    }

    showSuccess(message) {
        // Add a temporary success message (optional enhancement)
        console.log('Success:', message);
    }

    // New methods for extended features
    async toggleAutomod(setting, element) {
        const isActive = element.classList.contains('active');
        const newValue = !isActive;

        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/automod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [setting]: newValue })
            });

            if (response.ok) {
                element.classList.toggle('active');
                if (!this.currentGuild.config.automod) this.currentGuild.config.automod = {};
                this.currentGuild.config.automod[setting] = newValue;
            } else {
                throw new Error('Failed to update auto-moderation setting');
            }
        } catch (error) {
            console.error('Error updating automod:', error);
            this.showError('Failed to update auto-moderation setting');
        }
    }

    async updateAutomodAction(action) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/automod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action })
            });

            if (response.ok) {
                if (!this.currentGuild.config.automod) this.currentGuild.config.automod = {};
                this.currentGuild.config.automod.action = action;
                this.showSuccess('Auto-moderation action updated successfully');
            } else {
                throw new Error('Failed to update auto-mod action');
            }
        } catch (error) {
            console.error('Error updating automod action:', error);
            this.showError('Failed to update auto-moderation action');
        }
    }

    async updateLevelingChannel(channelId) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/leveling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ announceChannel: channelId })
            });

            if (response.ok) {
                if (!this.currentGuild.config.leveling) this.currentGuild.config.leveling = {};
                this.currentGuild.config.leveling.announceChannel = channelId;
                this.showSuccess('Leveling announcement channel updated successfully');
            } else {
                throw new Error('Failed to update leveling channel');
            }
        } catch (error) {
            console.error('Error updating leveling channel:', error);
            this.showError('Failed to update leveling channel');
        }
    }

    async updateLevelingMultiplier(multiplier) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/leveling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ multiplier: multiplier })
            });

            if (response.ok) {
                if (!this.currentGuild.config.leveling) this.currentGuild.config.leveling = {};
                this.currentGuild.config.leveling.multiplier = multiplier;
                this.showSuccess('XP multiplier updated successfully');
            } else {
                throw new Error('Failed to update XP multiplier');
            }
        } catch (error) {
            console.error('Error updating XP multiplier:', error);
            this.showError('Failed to update XP multiplier');
        }
    }

    async toggleWelcome(setting, element) {
        const isActive = element.classList.contains('active');
        const newValue = !isActive;

        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [setting]: newValue })
            });

            if (response.ok) {
                element.classList.toggle('active');
                if (!this.currentGuild.config.welcome) this.currentGuild.config.welcome = {};
                this.currentGuild.config.welcome[setting] = newValue;
            } else {
                throw new Error('Failed to update welcome setting');
            }
        } catch (error) {
            console.error('Error updating welcome setting:', error);
            this.showError('Failed to update welcome setting');
        }
    }

    async toggleGoodbye(setting, element) {
        const isActive = element.classList.contains('active');
        const newValue = !isActive;

        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/goodbye`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [setting]: newValue })
            });

            if (response.ok) {
                element.classList.toggle('active');
                if (!this.currentGuild.config.goodbye) this.currentGuild.config.goodbye = {};
                this.currentGuild.config.goodbye[setting] = newValue;
            } else {
                throw new Error('Failed to update goodbye setting');
            }
        } catch (error) {
            console.error('Error updating goodbye setting:', error);
            this.showError('Failed to update goodbye setting');
        }
    }

    async updateGoodbyeChannel(channelId) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/goodbye`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: channelId })
            });

            if (response.ok) {
                if (!this.currentGuild.config.goodbye) this.currentGuild.config.goodbye = {};
                this.currentGuild.config.goodbye.channelId = channelId;
                this.showSuccess('Goodbye channel updated successfully');
            } else {
                throw new Error('Failed to update goodbye channel');
            }
        } catch (error) {
            console.error('Error updating goodbye channel:', error);
            this.showError('Failed to update goodbye channel');
        }
    }

    async updateGoodbyeMessage(message) {
        try {
            const response = await fetch(`${this.apiBase}/api/bot/guild/${this.currentGuild.id}/config/goodbye`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            if (response.ok) {
                if (!this.currentGuild.config.goodbye) this.currentGuild.config.goodbye = {};
                this.currentGuild.config.goodbye.message = message;
                this.showSuccess('Goodbye message updated successfully');
            } else {
                throw new Error('Failed to update goodbye message');
            }
        } catch (error) {
            console.error('Error updating goodbye message:', error);
            this.showError('Failed to update goodbye message');
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize dashboard when page loads
const dashboard = new DiscordBotDashboard();

// Auto-refresh every 30 seconds
setInterval(() => {
    dashboard.loadBotStatus();
}, 30000);