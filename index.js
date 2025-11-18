require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const path = require('path'); // <<< 1. Import the 'path' module

// --- Configuration ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.DISCORD_TOKEN;

// IMPORTANT: Define both the file path and the directory path
const BATCH_FILE_PATH = 'C:\\7dtd_server\\startdedicated.bat';

// <<< 2. Define the directory where the .bat file lives
// This is the working directory (CWD) we will use.
const BATCH_DIR = path.dirname(BATCH_FILE_PATH);

// --- Discord Events ---

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase(); // ------------------------------------------------ // 🚀 THE SERVER START COMMAND // ------------------------------------------------

  if (command === 'start7d2d') {
    await message.reply('Starting 7 Days to Die server...');
    console.log(
      `Attempting to run: ${BATCH_FILE_PATH} from directory: ${BATCH_DIR}`
    ); // Useful for debugging! // 'exec' is used to execute a shell command.

    exec(
      `"${BATCH_FILE_PATH}"`,
      {
        cwd: BATCH_DIR, // <<< 3. Add the working directory option
        shell: true, // <<< 4. Optional: Force shell execution
      },
      (error, stdout, stderr) => {
        // ... (rest of your error handling code)

        if (error) {
          console.error(`Exec Error: ${error}`);
          message.channel.send(
            `**❌ Server Start Failed:** \n\`\`\`${error.message}\`\`\``
          );
          return;
        }

        if (stderr) {
          // console.error(`Stderr: ${stderr}`);
        }

        message.channel.send(
          '**✅ 7 Days to Die Server Launched!** Check your PC for the console window.'
        );
      }
    );
  }
});

client.login(BOT_TOKEN);
