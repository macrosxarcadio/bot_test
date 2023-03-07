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
            scopes: 'https://www.googleapis.com/auth/spreadsheets'
        });
        const client = await auth.getClient();
        // Usa el cliente para hacer llamadas a la API de Google
        return client
    } catch (error){
        console.log("error of auth :",error);
    }

}

async function read(range, majorDimension) {
    try {
        //Instance of google sheets api
        console.log("auth malo")
        client = main();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const met = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId: '1Ku5VfmmmsTGDzEUoPqUQ-Hdh0bD-mmSfF4u6O6sFj8I',
            range: `${range}`,
            majorDimension: majorDimension ? majorDimension : null,
        });
        return met.data.values;
    } catch (error) {
        console.log(error);
    }
}

async function readBalance(month, worker) {
    try {
        // funciona como un buscar V
        let balanceMonth = await read('Base!C:N', 'ROWS');
        const date = new RegExp(`${month}\/2022`);
        const work = new RegExp(`^${worker}$`);
        const actual = [];
        const workers = [];
        balanceMonth.forEach(item => item.forEach((a) => !!a.match(date) && actual.push(item)));
        actual.forEach(item => item.forEach((a) => !!a.match(work) && workers.push(item)));
        return workers;
    } catch (error) {
        console.log(error);
    }
}

async function readPersonalBalance(month) {
    // funciona como un buscar V
    let balanceRow = await read('!J:J', 'COLUMNS');
    /*     let row = await balanceRow[0].indexOf(`${month}`, 0);
        let balance = await read(`hoja_1!K${row + 1}`, 'COLUMNS'); */
    return balanceRow;
}

async function write(data) {
    //Instance of google sheets api
    try {
        client = main()
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const writing = await googleSheets.spreadsheets.values.append({
            spreadsheetId: '1Ku5VfmmmsTGDzEUoPqUQ-Hdh0bD-mmSfF4u6O6sFj8I',
            range: 'Gastos-Commit!A:J',
            valueInputOption: 'RAW',
            resource: data,
            auth,
        });
        return writing;
    } catch (error) {
        console.log(error);
    }
}

//Declare new spent
bot.command('gasto', (ctx) => {
    const regtime = moment().format('DD-MM-YYYY');
    const str = ctx.message.text;
    const spentReg = str.match(/(?:^\/\w+)(\s+)(?<worker>\w+)(\s+)(?<money>-?\d+)(\s+)+(?<notes>.+)/mu)
    if (spentReg !== null && spentReg !== undefined) {
        const { worker, money, notes } = spentReg.groups;
        const data = { values: [[, , regtime, , money, worker, notes, 'bot']] };
        console.log("llega a write", data);
        console.log("write func", write(data));
        write(data);
        ctx.reply(` persona: ${worker} \n monto: ${money} \n notas: ${notes} \n fecha: ${regtime}`);
    } else {
        ctx.reply(`anote bien`);
        ctx.reply(spentReg);
    }
});

// Test telegram service with out test google services 
bot.command('help', (ctx) => {
    ctx.reply('Hola! soy el bot de gestion contable de commit_36 \n\n Consultas que puedes realizar: \n\n 1) Consultar sueldo antes de aportes \n\t/sueldo mes trabajador \n 2)Registrar gasto \n\t /gasto trabajador monto tipo de gasto');
})
// See the earned money and the time allocated in a project for a specific worker
bot.command('sueldo', (ctx) => {
    const str = ctx.message.text;
    const txt = str.split(/(\s+)/).filter((item) => {
        return item !== ' ';
    }, []);
    readBalance(txt[1], txt[2]).then((response) => response.forEach(a => ctx.reply(`Trabajadora: ${a[3]} \nProyecto: ${a[2]} \nHoras: ${a[7]} \nSueldo antes aporte: ${a[9]}`)));
});

module.exports = bot.webhookCallback('/api')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

