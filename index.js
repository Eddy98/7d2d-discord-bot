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

const { Telnet } = require('telnet-client');
const telnetConfig = {
  host: process.env.TELNET_HOST || '127.0.0.1',
  port: parseInt(process.env.TELNET_PORT) || 8081,

  // *** CRITICAL FIX: The shell prompt regex for 7D2D Telnet ***
  // This regex looks for an optional prompt followed by '>', which 7D2D uses.
  shellPrompt: /^(\w+)?\s*>/,

  timeout: 3000,
  password: process.env.TELNET_PASSWORD || '',
  negotiationMandatory: false,

  // Add wait time after initial connection and password sent
  initialDelay: 500,

  // Use this to help debug connection issues if the problem persists
  // debug: true,
};

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

  if (command === 'stop7d2d') {
    await message.reply('Attempting safe server shutdown via Telnet...');

    const telnet = new Telnet();

    try {
      // 1. Connect to the Telnet port
      await telnet.connect(telnetConfig);

      // Get password from environment (ensure it's not null/undefined)
      const telnetPassword = process.env.TELNET_PASSWORD || '';

      // --- Manual Command Sending with Delays (More Robust) ---

      console.log('Sending password for Telnet login...');
      await telnet.send(telnetPassword); // Wait for server to process the login
      await new Promise((resolve) => setTimeout(resolve, 500)); // 3. Send 'saveworld' command.

      console.log('Sending saveworld...');
      await telnet.send('saveworld'); // Wait for server to save the world (needs a longer pause)
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 4. Send 'shutdown' command.

      console.log('Sending shutdown...');
      await telnet.send('shutdown'); // Wait a small moment for the command to be sent before server closes the connection
      await new Promise((resolve) => setTimeout(resolve, 500)); // 5. Clean up connection
      telnet.end();

      message.channel.send(
        '**🛑 7 Days to Die Server Safely Shut Down.** World saved!'
      );
    } catch (e) {
      console.error('Telnet Error:', e); // Check if the connection failed outright (server not running or port blocked)
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEOUT') {
        message.channel.send(
          `**❌ Shutdown Failed:** Could not connect to Telnet on port ${telnetConfig.port}. Is the server running and accessible?\nError: \`\`\`${e.message}\`\`\``
        );
      } else {
        // If the error occurred after the commands were sent (likely due to the connection break
        // from the shutdown command or a generic timeout after login/saveworld).
        message.channel.send(
          `**⚠️ Shutdown attempt complete.** Telnet connection closed unexpectedly, but commands were sent. Server is very likely shutting down. (Error: \`\`\`${e.message}\`\`\` )`
        );
      }
    }
  }
});

client.login(BOT_TOKEN);
