import config from "./data/config.json" with {type:"json"};
import desired from "./data/desired.json" with {type:"json"};
import {chromium} from "playwright";
import {expect} from "@playwright/test";
import {writeFileSync} from "node:fs";
const browser = await chromium.launch({headless:false});
const ctx = await browser.newContext({reducedMotion:"reduce",storageState:"data/auth.json"});
const page = await ctx.newPage();

console.error("UA: " + await page.evaluate(() => navigator.userAgent));

// Navigate to home so that cookies are refreshed etc.
// We do this also because this is the easiest way to get the URL of our drive
await page.goto(`https://${config.tenant}-my.sharepoint.com/my`);
// Workaround redirects...
await page.waitForLoadState();
console.error("At OneDrive now");
await expect(page.locator("a[aria-label='Go to OneDrive']")).toBeVisible();
console.error("Interface has loaded");
const myDriveToken = await page.evaluate(() => window._spPageContextInfo.driveInfo[".driveAccessToken"].substr(13));
const myDriveUrl = await page.evaluate(() => window._spPageContextInfo.driveInfo[".driveUrl"]);
const myDriveId = myDriveUrl.slice(myDriveUrl.indexOf("b!"));
const webAbsoluteUrl = await page.evaluate(() => window._spPageContextInfo.webAbsoluteUrl);

// Actually get the drives.
const api = ctx.request;
const contextinfoReq = await api.post(`${webAbsoluteUrl}/_api/contextinfo`, {
  headers: {"Accept": "application/json"},
  data: {}
});
const digest = JSON.parse((await contextinfoReq.body()).toString())["FormDigestValue"];

for (const drive in desired) {
  let result = await api.post(`${webAbsoluteUrl}/_api/SP.List.GetListDataAsStream`, {
    params: {
      "listFullUrl": `'${desired[drive].url}'`, // Yes, it really works this way
      "TryNewExperienceSingle": "TRUE"
    },
    headers: {
      "Accept": "application/json;odata=verbose",
      "Content-Type": "application/json;odata=verbose",
      "X-Requestdigest": digest
    },
    // Pasted from a browser
    data: {"parameters":{"__metadata":{"type":"SP.RenderListDataParameters"},"RenderOptions":1069063,"ViewXml":"<View ><Query></Query><ViewFields><FieldRef Name=\"DocIcon\"/><FieldRef Name=\"LinkFilename\"/><FieldRef Name=\"Modified\"/><FieldRef Name=\"Editor\"/><FieldRef Name=\"FileSizeDisplay\"/><FieldRef Name=\"SharedWith\"/><FieldRef Name=\"_ip_UnifiedCompliancePolicyUIAction\"/><FieldRef Name=\"ItemChildCount\"/><FieldRef Name=\"FolderChildCount\"/><FieldRef Name=\"SMTotalFileCount\"/><FieldRef Name=\"SMTotalSize\"/><FieldRef Name=\"File_x0020_Type\"/><FieldRef Name=\"FileRef\"/><FieldRef Name=\"FileLeafRef\"/><FieldRef Name=\"Author\"/><FieldRef Name=\"PrincipalCount\"/><FieldRef Name=\"Title\"/></ViewFields><RowLimit Paged=\"TRUE\">1</RowLimit></View>","AddRequiredFields":true,"RequireFolderColoringFields":true}}
  });
  let schema = JSON.parse((await result.body()).toString())["ListSchema"];
  console.log(`[${drive}]`);
  console.log("type = onedrive");
  console.log("drive_type = business");
  if (desired[drive].my) {
    console.log(`token = {"access_token":"${myDriveToken}","token_type":"Bearer","refresh_token":"","expiry":"2099-12-31T23:59:59Z"}`);
    console.log(`drive_id = ${myDriveId}`);
    console.log(`tenant_url = https://${config.tenant}-my.sharepoint.com/_api`);
  } else {
    console.log(`token = {"access_token":"${schema['.driveAccessToken'].substr(13)}","token_type":"Bearer","refresh_token":"","expiry":"2099-12-31T23:59:59Z"}`);
    console.log(`drive_id = ${desired[drive].id}`);
    console.log(`tenant_url = https://${config.tenant}.sharepoint.com/_api`);
  }
  console.log(""); // for readability sake
  // As the API does not have very clear ratelimits, play it safe.
  await new Promise(r => setTimeout(r, 2000));
}
// As the script has successfully completed, we save the refreshed cookies.
await ctx.storageState({path: "data/auth.json"});
await ctx.close();
await browser.close();

