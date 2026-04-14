// TODO: make config reading less ugly
import config from "./data/config.json" with {type:"json"};
import {chromium} from "playwright";
import {expect} from "@playwright/test";
import {writeFileSync} from "node:fs";
const browser = await chromium.launch({headless:false});
const ctx = await browser.newContext({reducedMotion:"reduce",storageState:"data/auth.json"});
const page = await ctx.newPage();

console.log("UA: " + await page.evaluate(() => navigator.userAgent));

// Navigate to Places to get our SharePoint personal URL.
// This is also required to get group URLs for some reason - they are null otherwise.
await page.goto(`https://${config.tenant}-my.sharepoint.com/places`);
await page.waitForLoadState();
console.error("At OneDrive now");
await expect(page.locator("a[aria-label='Go to OneDrive']").first()).toBeVisible();
console.error("Interface has loaded");
const webAbsoluteUrl = await page.evaluate(() => window._spPageContextInfo.webAbsoluteUrl);
console.error(`My SharePoint URL is ${webAbsoluteUrl}`);

// Actually get the drives.
const api = ctx.request;
const contextinfoReq = await api.post(`${webAbsoluteUrl}/_api/contextinfo`, {
  headers: {"Accept": "application/json"},
  data: {}
});
const digest = JSON.parse((await contextinfoReq.body()).toString())["FormDigestValue"];
const result = await api.post(`${webAbsoluteUrl}/_api/GroupSiteManager/GetCurrentUserJoinedTeams`, {
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-RequestDigest": digest
  },
  data: {
    getLogoData: false
  }
});

// this API nests JSON cause sure, why not
const teams = JSON.parse(JSON.parse((await result.body()).toString("utf-8"))["value"])["value"];
console.log("| Team | Drive Name | Drive ID | Drive URL |");
console.log("| ---- | ---------- | -------- | --------- |");
let acquired = [{
  my: true,
  team: "My OneDrive",
  title: "Documents",
  // No point in storing the ID, we can get it again later
}];
for (const team of teams) {
  let result = await api.get(`${webAbsoluteUrl}/_api/SP.Web.GetDocumentLibraries`, {
    params: {
      "webFullUrl": `'${team.GroupSiteUrl}'` // Yes, it really works this way
    },
    headers: {
      "Accept": "application/json"
    }
  });
  let drives = JSON.parse((await result.body()).toString())["value"];
  for (const x of drives) {
    console.log(`| ${team.displayName} | ${x.Title} | ${x.DriveId} | ${x.AbsoluteUrl} |`);
    acquired.push({team: team.displayName, title: x.Title, id: x.DriveId, url: x.AbsoluteUrl});
  }
  await new Promise(r => setTimeout(r, 2000));
}
writeFileSync("data/drives.json", JSON.stringify(acquired));
await ctx.close();
await browser.close();
