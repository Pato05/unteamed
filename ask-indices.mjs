import drives from "./data/drives.json" with {type:"json"};
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import slugify from "slugify";
import enquirer from 'enquirer';

async function selectDrives(drives) {
  const prompt = new enquirer.MultiSelect({
    name: 'value',
    message: 'choose drives to add to desired.json',
    choices: drives.map((x, i) => ({
      name: i.toString(),
      message: `${x.title} | ${x.team}`
    }))
  });

  try {
    const selected = await prompt.run();
    if (!selected.length) process.exit(1);
    return selected; // returns array of strings, e.g., ["0", "2"]
  } catch (err) {
    process.exit(1); // handles ctrl+c
  }
}

// We use numeric tags, so it is safe to remove quotes
let choices = (await selectDrives(drives)).map(x => Number(x)).map(x => drives[x]);
console.log("You will now be asked to set a remote name for each chosen drive.");
console.log("The default name will be denoted by square backets. To use it, press ENTER.");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let chosen = {};
for (const x of choices) {
  let slug = slugify(`${x.title}_${x.team}`, "_");
  let question = `Name for ${x.title} | ${x.team} [${slug}]? `;
  let answer = await rl.question(question);
  chosen[answer || slug] = x;
}
writeFileSync("data/desired.json", JSON.stringify(chosen));
rl.close();
console.log("Done! gettokens.mjs should now be able to operate.");
