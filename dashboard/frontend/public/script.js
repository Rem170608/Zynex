class DiscordBotDashboard {
    constructor() {
        this.apiBase = '';
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
            
            this.displayServerDetails(guild);
        } catch (error) {
            console.error('Failed to load server details:', error);
            this.showError('Failed to load server details');
        }
    }

    displayServerDetails(guild) {
        const serverDetails = document.getElementById('server-details');
        const serverInfo = document.getElementById('server-info');
        
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
                        <div class="channel-item">
                            # ${this.escapeHtml(channel.name)}
                        </div>
                    `).join('') || '<p>No channels found</p>'}
                </div>
            </div>
        `;
        
        serverDetails.style.display = 'block';
        serverDetails.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        const serversGrid = document.getElementById('servers-grid');
        serversGrid.innerHTML = `<div class="error">${message}</div>`;
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