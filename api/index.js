const express = require('express');
var moment = require('moment');
const { Telegraf } = require('telegraf');
const app = express();
const { google } = require('googleapis');
var _ = require('lodash');
const { forEach } = require('lodash');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config()
const bot = new Telegraf(process.env.BOT_TOKEN)

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log(typeof (JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)))


async function main() {
    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/spreadsheets',
            keyFile: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        });
        const client = await auth.getClient();
        // Usa el cliente para hacer llamadas a la API de Google
        return client
    } catch (error){
        console.log("error of auth :",error);
    }
}

bot.command('read', (ctx) => {
    console.log(ctx);
    ctx.reply(ctx.message.text);
})


module.exports = bot.webhookCallback('/api')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

