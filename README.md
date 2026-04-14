# unteamed
Tools for accessing your education OneDrive and/or Teams files without third party sign-in or app passwords.

## Before you use this
First, try adding your education OneDrive account normally to rclone. Your account may be old enough to
still be set to allow 3rd party app sign-in by default. If so, you will not need this project at all.

If you can't, see if it is within the realm of possibility for your administrator to permit you to use rclone.
If your administrator dislikes the prospect of letting you use a command-line tool - try asking for Cyberduck
instead, as a native GUI tool is still far better than using an infamously slow web app (or, on the other hand,
a slightly less slow web app that takes more clicks to open).

If that's not an option, congratulations, this repository is for you.

> [!CAUTION]
> Using this software in a business environment is likely a bad idea.
> See: [the Wikipedia article on Shadow IT](https://en.wikipedia.org/wiki/Shadow_IT), which is an eerily accurate description of this software.
> This set of scripts was made to speed up the process of fetching my study material from various Teams/SharePoint drives.
> Per the license, this software comes with no warranty of any sort. Your use of it is strictly your responsibility.

## How to use
**NOTE**: As of 14/04/2026, this will NOT work with upstream rclone.

1. Run `npm install`
2. Install the dependencies for Playwright (outside the scope of this guide).
3. Run `mkdir data`
4. Create a file at `data/config.json` containing `{"tenant":"example"}` replacing `example` with your tenant name (`example.sharepoint.com` -> `example`)
5. Run `node login.mjs` on a machine with a desktop and log in. Login data is stored in `data/auth.json`, transfer it if needed.
6. Run `node getdrives.mjs` - if you do not have a desktop and are on Linux, you will likely need `xvfb-run`. This will create `data/drives.json`.
7. Run `node ask-indices.mjs` then follow the prompts. This will create `data/desired.json`.
8. Run `node gettokens.mjs > data/rclone.conf` to create an rclone config containing your drives. Similar to `getdrives.mjs`, you may need `xvfb-run`.
9. Build rclone from this PR: https://github.com/rclone/rclone/pull/8822
10. Add the contents of `data/rclone.conf` to your rclone config in any way you prefer.

The simplest choice is to keep your config in a seperate location like `$HOME/.config/rclone/rclone.pre.conf`,
then merge it with what you get from unteamed using `cat` like:
`cat ~/.config/rclone/rclone.pre.conf ~/unteamed/data/rclone.conf > ~/.config/rclone/rclone.conf`

Note that you will have to do this somewhat frequently due to token expiry. The purpose of this software is to help you automate the process described in the PR linked in Step 9.

## Extra info
The validity of an OneDrive web token is currently unknown.

I recommend setting this up on a remote computer - in my case, a Raspberry Pi 5 in my dorm.
Doing so will let you avoid opening a browser with OneDrive on the device you actually use, like an underpowered laptop.
You can then use `rclone serve` to serve your drives over various protocols to avoid having to get rclone to run on your other devices.

In the semi-likely case that you will need to use a lot of drives at once, using a [combine remote](https://rclone.org/combine/) is the best option to make navigation easier.

## Project info
### Why?
Currently, I am using a mid 2011 MacBook Air running macOS 12 for my university work. While I do have a considerably newer and more powerful Windows laptop, I do not wish to walk around with an
about thousand dollar slab in my backpack. Said MacBook is great at taking notes in class, the aftermarket battery easily gets me through a day of lectures and
unlike a certain operating system from Redmond, I don't get asked to do silly things such as "finish setting up my computer that I have been using for years", or perhaps
"upload parts of my home directory to the cloud, in non-E2E-encrypted form". The problem comes when I have to get a PDF off the Files tab on Teams. Sure, I can do it, but it takes
me about a minute and a half to get there - I lose an extra 15-20 seconds if I didn't open Teams earlier on any given day, because that's how long it takes to realize that it needs to reauthenticate.
It also hogs RAM like crazy, which is a bit scarce on a 4GB RAM system. I can also get there via OneDrive, which is a bit faster but still hogs RAM - every single click fetches around 10 JavaScript files.
Ideally, I would be able to just login via rclone and then run rclone serve ftp on my Raspberry Pi 5, but given the chances of being able to contact the Office 365 administrator here are near zero,
I decided to look for an alternative way to get rclone to work with this. Suprisingly, there is a PR that does exactly this - however it relies on manually fetching the tokens every time they expire.
I gave automating this process a try. After about 4 hours of poking in devtools, making a script to login as me (which has been scrapped), making a script to list all the drives I have access to,
I made an extremely rough script that did it. Another 6 hours went towards making it just a bit more usable than expecting the user to copy and paste dozens of IDs manually, and you are looking at
the result of that now.

Have fun!
2026 https://mattx.cloud/
