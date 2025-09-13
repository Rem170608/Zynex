import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(__dirname, '../data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'guild-configs.json');

// Default configuration for new guilds
const DEFAULT_CONFIG = {
    logChannel: null,
    moderation: {
        banEnabled: true,
        timeoutEnabled: true,
        lockEnabled: true,
        kickEnabled: true,
        warnEnabled: true,
        clearEnabled: true,
        slowmodeEnabled: true,
        logActions: true,
        autoWarnActions: false,
        maxWarnings: 3,
        warnAction: 'timeout' // 'timeout', 'kick', or 'none'
    },
    features: {
        automod: false,
        welcomeMessages: false,
        autoRole: false
    },
    welcomeChannel: null,
    welcomeMessage: "Welcome to the server, {user}!",
    autoRole: null
};

class ConfigManager {
    constructor() {
        this.configs = new Map();
        this.initialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            await fs.mkdir(CONFIG_DIR, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf8');
            const configs = JSON.parse(data);
            this.configs = new Map(Object.entries(configs));
        } catch (error) {
            // File doesn't exist or is invalid, start with empty configs
            this.configs = new Map();
            await this.saveConfigs();
        }
        
        this.initialized = true;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }

    async saveConfigs() {
        const configObj = Object.fromEntries(this.configs);
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configObj, null, 2));
    }

    async getGuildConfig(guildId) {
        await this.ensureInitialized();
        if (!this.configs.has(guildId)) {
            this.configs.set(guildId, { ...DEFAULT_CONFIG });
            await this.saveConfigs();
        }
        return this.configs.get(guildId);
    }

    async updateGuildConfig(guildId, updates) {
        const current = await this.getGuildConfig(guildId);
        const updated = { ...current, ...updates };
        this.configs.set(guildId, updated);
        await this.saveConfigs();
        return updated;
    }

    async updateNestedConfig(guildId, section, updates) {
        const current = await this.getGuildConfig(guildId);
        current[section] = { ...current[section], ...updates };
        this.configs.set(guildId, current);
        await this.saveConfigs();
        return current;
    }

    getAllConfigs() {
        return Object.fromEntries(this.configs);
    }

    async deleteGuildConfig(guildId) {
        this.configs.delete(guildId);
        await this.saveConfigs();
    }
}

// Export singleton instance
export const configManager = new ConfigManager();