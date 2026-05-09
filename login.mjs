import config from "./data/config.json" with {type:"json"};
import {chromium} from "playwright";
import * as readline from "node:readline/promises";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const browser = await chromium.launch({headless:false});
const ctx = await browser.newContext({reducedMotion:"reduce"});
const page = await ctx.newPage();
console.log("UA: " + await page.evaluate(() => navigator.userAgent));

await page.goto(`https://${config.tenant}-my.sharepoint.com/`);
await rl.question("Please login to your account now. Once you are at the OneDrive homepage, press Enter in this terminal.");
rl.close();
await ctx.storageState({path: "./data/auth.json"});
await ctx.close();
await browser.close();
console.log("Done.");
