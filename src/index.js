console.clear();

require("dotenv").config();
const os = require("os");
const fs = require("fs");
const util = require("util");
const { Client, GatewayIntentBits, Routes, Collection } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { registerSlashCommands, registerEvents } = require("./utils/registry");

console.log(`[Startup] Starting application...`);

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	],
});
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

async function main() {
	try {
		client.slashCommands = new Collection();
		await registerSlashCommands(client, "../commands");

		client.events = new Collection();
		await registerEvents(client, "../events");

		const slashCommandsJSON = client.slashCommands.map((cmd) =>
			cmd.getSlashCommandJSON()
		);

		console.log("[Startup] Started refreshing application (/) commands.");
		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID),
			{
				body: slashCommandsJSON,
			}
		);
		await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
			body: slashCommandsJSON,
		});

		console.log("[Startup] Successfully reloaded application (/) commands.");

		client.events.forEach((event) => {
			if (event.isOnce) {
				client.once(event.name, (...args) => event.run(client, ...args));
			} else {
				client.on(event.name, (...args) => event.run(client, ...args));
			}
		});

		console.log("[Startup] Logging bot in...");
		await client.login(process.env.TOKEN);
	} catch (error) {
		console.log(`[Startup] An unexpected error occured during startup`);
		console.log(`[Startup] ${error.stack}`);
	}
}

main();
