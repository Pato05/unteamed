import drives from "./data/drives.json" with {type:"json"};
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import * as readline from "node:readline/promises";
import slugify from "slugify";

let whiptailOptions = drives.map(x => `${x.title} | ${x.team}`).map((x,i) => [i.toString(),x,"0"]).flat();
let whiptailArgs = [
  "--output-fd", "2",
  "--checklist", "Choose drives to add to desired.json",
  process.stdout.rows-15,
  process.stdout.columns-10,
  process.stdout.rows-25,
  ...whiptailOptions
];
let { stderr, status } = spawnSync("whiptail", whiptailArgs, {stdio:["inherit", "inherit", "pipe"]});
if (status != 0) process.exit(status);

// We use numeric tags, so it is safe to remove quotes
let whiptail_output = stderr.toString("utf8").replaceAll("\"","");
if (whiptail_output == "") process.exit(1);
let choices = whiptail_output.split(" ").map(x => Number(x)).map(x => drives[x]);
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
