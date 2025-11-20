require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const path = require('path');
const { Telnet } = require('telnet-client');

// --- Configuration ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.DISCORD_TOKEN;

const ALLOWED_USERS_RAW = process.env.ALLOWED_USERS || '';
const ALLOWED_USERS = ALLOWED_USERS_RAW.split(',')
  .map((id) => id.trim())
  .filter((id) => id.length > 0);
console.log(`🔒 Authorized Users: ${ALLOWED_USERS.join(', ')}`);

const telnetConfig = {
  host: process.env.TELNET_HOST || '127.0.0.1',
  port: parseInt(process.env.TELNET_PORT) || 8081,
  shellPrompt: /^(\w+)?\s*>/,
  timeout: 3000,
  password: process.env.TELNET_PASSWORD || '',
  negotiationMandatory: false,
  initialDelay: 500,
};

// IMPORTANT: Define both the file path and the directory path
const BATCH_FILE_PATH = 'C:\\7dtd_server\\startdedicated.bat';
const BATCH_DIR = path.dirname(BATCH_FILE_PATH);

// --- Discord Events ---
client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  if (!ALLOWED_USERS.includes(message.author.username)) {
    console.log(
      `Unauthorized user attempted command: ${message.author.tag} (${message.author.username})`
    );
    return message.reply('❌ You are not authorized to use this command.');
  }

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ------------------------------------------------ // 🚀 THE SERVER START COMMAND
  if (command === 'start7d2d') {
    await message.reply('Starting 7 Days to Die server...');
    console.log(
      `Attempting to run: ${BATCH_FILE_PATH} from directory: ${BATCH_DIR}`
    );

    exec(
      `"${BATCH_FILE_PATH}"`,
      {
        cwd: BATCH_DIR, // Add the working directory option
        shell: true, // Optional: Force shell execution
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Exec Error: ${error}`);
          message.channel.send(
            `**❌ Server Start Failed:** \n\`\`\`${error.message}\`\`\``
          );
          return;
        }
      }
    );

    message.channel.send(
      '**✅ 7 Days to Die Server Launched!**\nEsperate como 3 minutos antes de uniter mamaguevo'
    );
  }

  // ------------------------------------------------ // 🛑 THE SERVER STOP COMMAND
  if (command === 'stop7d2d') {
    await message.reply('Attempting safe server shutdown via Telnet...');

    const telnet = new Telnet();

    try {
      // Connect to the Telnet port
      await telnet.connect(telnetConfig);

      const telnetPassword = process.env.TELNET_PASSWORD || '';

      console.log('Sending password for Telnet login...');
      await telnet.send(telnetPassword);
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('Sending saveworld...');
      await telnet.send('saveworld');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('Sending shutdown...');
      await telnet.send('shutdown');
      await new Promise((resolve) => setTimeout(resolve, 500));
      telnet.end();

      message.channel.send(
        '**🛑 7 Days to Die Server Safely Shut Down.** \nYA DANIEL, VETEEE A DORMIR!'
      );
    } catch (e) {
      console.error('Telnet Error:', e);
      if (e.code === 'ECONNREFUSED' || e.code === 'ETIMEOUT') {
        message.channel.send(
          `**❌ Shutdown Failed:** Could not connect to Telnet on port ${telnetConfig.port}. Is the server running and accessible?\nError: \`\`\`${e.message}\`\`\``
        );
      } else {
        message.channel.send(
          `**⚠️ Shutdown attempt complete.** Telnet connection closed unexpectedly, but commands were sent. Server is very likely shutting down. (Error: \`\`\`${e.message}\`\`\` )`
        );
      }
    }
  }

  // ------------------------------------------------ // 🌙 THE SLEEP COMPUTER COMMAND
  if (command === 'sleepcomputer') {
    await message.reply('Initiating system sleep sequence...');
    console.log('Attempting to put the computer to sleep via PowerShell.');

    // This PowerShell command forces the system into the suspend (sleep) state.
    const sleepCommand =
      'powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState(\'Suspend\', $false, $false)"';

    exec(sleepCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Sleep Error: ${error}`);
        message.channel.send(
          `**❌ System Sleep Failed:** \n\`\`\`${error.message}\`\`\``
        );
        return;
      }
      console.log('Sleep command executed successfully.');
    });

    // Send a message immediately, as the exec callback might not fire before sleep.
    message.channel.send('**😴 Computer is now going to sleep.** Goodbye!');
  }
});

client.login(BOT_TOKEN);
