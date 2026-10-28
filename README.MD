# CK3 Dashboard

A mobile-friendly web app that runs on top of the **Tracker** Google Sheet. The sheet stays the single source of truth. Members use the app to update their status, availability and Top 2 song picks, and Execs use it to see overlap and suggested dance units.

Free to run: it uses Google Apps Script, which is included with any Google account.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | Server code. Reads and writes the sheet. |
| `Index.html` | The app screen members see. |

## What the app does

| Tab | What it shows |
|---|---|
| **Home** | Counts (active members, in progress, in editing, released, picks submitted), upcoming events with countdowns, semester rules. |
| **Board** | One card per project. Released projects are tinted green and hide practice times. Event dates show where set. |
| **Members** | Each member sets their own status: Active Fall, Active Winter, Active Summer, Hiatus, Left. |
| **Top 2 Picks** | Choose a two-month period and your name, then enter two songs. Shows which songs have overlapping interest and who has not submitted. |
| **Availability** | **Everyone** view: a heatmap of how many members are free each hour. Tap a time to see who is free and who is not. **My availability** view: pick your name and tap the hours you can usually practice (9:00 to 22:00). |
| **Suggest** | For each picked song, finds the best weekly time window where the most interested active members are free. A song is **viable** with 2 or more members sharing a slot. The goal is 2+ viable units per period. |
| **Units** | Current dance units and members. |

The suggestions are advice only. VP Dance decide the final units.

## Sheet requirements

The app finds columns by their header names, so do not rename these.

**Board 2026** (header row 1): `Dance Unit`, `Type`, `Event`, `Practice Schedule`, `Status`, `Playlist Link`, plus a new column **`Event Date`** (real dates, not typed text).
Status values the app understands: `Learning`, `Editing`, `Released`, `Cancelled`.

**Dance Unit** (header row 1): `Dance Unit`, `Member ID` (IDs separated by commas, for example `26, 21, 4, 27`).

**Members Info** (header row can have notes above it): `ID`, `Full Name`, `Stage Name`, `Status`, `Last Updated`.
Give each member a unique Stage Name. Duplicates get a number added, for example "Mimi #26".

**Created automatically by the app:**
- `Song Picks`: Period, Member ID, Pick 1, Pick 2, Updated
- `Availability`: Member ID, Slots, Updated
- `Updates`: Date, Update, Hide After (see Announcements)

## Setup (about 10 minutes, by the sheet owner)

1. Open the Management System sheet, then **Extensions → Apps Script**.
2. Paste `Code.gs` into the default `Code.gs` file.
3. Click **+ → HTML**, name the file exactly `Index`, paste in `Index.html`.
4. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone with the link** or **Anyone with a Google account**
5. Click Deploy and approve the permissions. Google shows an "unverified app" warning, which is normal for your own script.
6. Share the web app link with members. On a phone, use **Add to Home Screen** so it opens like an app.

## Each two-month period

1. First week: members update status, availability and Top 2 songs in the app.
2. Check **Top 2 Picks** for who is still missing.
3. Check **Suggest** for viable units and best times, then confirm the final units.
4. Add confirmed units to the **Dance Unit** tab and projects to **Board 2026**.
5. Rule to keep in mind: a minimum of 2 dance projects per period.

## Updating the app

- **Data changes** (projects, units, event dates, member details): edit the sheet, then tap ↻ in the app.
- **Code changes**: edit in Apps Script, then **Deploy → Manage deployments → Edit → New version**. Otherwise members keep seeing the old version.

## Privacy and access

- Emails, phone numbers and emergency contacts are never sent to the app. Only IDs, display names and statuses are.
- There is no login. Members choose their own name, so one member could edit another's entries. Setting access to "Anyone with a Google account" keeps out outside visitors but does not prevent this.
- Text entered by members is stored as plain text, and entries starting with `=`, `+`, `-` or `@` are neutralized so they cannot become spreadsheet formulas.

## Troubleshooting

| Problem | Likely fix |
|---|---|
| "Could not load data" | Check the tab names (Board 2026, Dance Unit, Members Info) and that header names match exactly. |
| Event dates missing | Add the `Event Date` column to Board 2026 and format the cells as dates. |
| Status does not save | Members Info needs `ID` and `Status` headers. |
| Changes to the code not showing | Deploy a **new version** (see Updating the app). |
| A member is missing from lists | Their `ID` cell is empty in Members Info, or their status is `Left` (hidden from name pickers). |
| Save fails when many people edit at once | Wait a few seconds and try again. Writes are queued one at a time. |

## Limits

- Google's free daily quotas for Apps Script apply: https://developers.google.com/apps-script/guides/services/quotas?v3=true#current_quotas
- Availability is a weekly pattern, not specific dates, and exceptions such as exams are not tracked.
- Practice rooms are not considered by the suggestions.

## Display rules

- Members with status **Left** are hidden everywhere in the app (lists, units, picks, availability). They stay in the sheet.
- Member status colours: Active Fall green, Active Winter blue, Active Summer yellow, Hiatus amber, not set grey.
- **Cancelled** projects show a red card. **Released** projects are green. Upcoming events on Home use a purple card with a small playlist link.
- Every Board card has a playlist button, or "No playlist yet" if the sheet's Playlist Link is empty or "-".
- **Overlap matching:** "BTS - Swan" and "Any BTS songs" count as overlapping. The "any" voters are added to every specific song by that artist and marked "(any song)". If only "any" picks exist for an artist, they form their own group.

## Announcements (Updates card on Home)

The VP Dance posts announcements by typing a new row in the **Updates** tab of the sheet (created automatically the first time the app loads):

| Date | Update | Hide After |
|---|---|---|
| 2026-10-24 | New round of projects starts mid-Nov, once the Sept projects wrap up. | 2026-11-20 |

- **Date**: use a real date cell. Newest dates show first.
- **Update**: the message. Line breaks are kept. Up to 600 characters.
- **Hide After** (optional): the card stops showing the message after this date. Leave blank to keep it up.
- The Home screen shows the latest 5. Delete a row to remove an update.
- You can also post from the app (below), or edit the sheet directly. Both work.

### Posting from the app (shared VP password)

1. One-time setup by the sheet owner: in Apps Script open **Project Settings (gear icon) → Script properties → Add script property**. Name: `VP_PASSWORD`, value: the password you choose. Share it only with the VP Dance and Execs.
2. On Home, tap **🔒 Exec tools**, enter the password, and tap **Unlock**.
3. Type the message, optionally set **Hide after**, and tap **Post update**. Each update also gets a **delete** link while unlocked.
4. Tap **Lock Exec tools** when done. The password is kept only until the page is closed or refreshed.

To change the password, edit the script property. After 5 wrong attempts, posting is blocked for 10 minutes. The password is never stored in the code or the sheet, and anyone who knows it can post, so change it when the VP role changes hands.

## Light / dark mode

The round button at the top right switches between a light (white) and dark (black) theme. The app starts in whichever your phone or browser uses, and remembers your choice on that device.

## Fixing a mistake in your Top 2 Pick

On **Top 2 Picks**, choose the period and your name. Your saved songs load into the boxes: change them and tap **Save**, or tap **Delete my picks** to remove them. The app has no login, so this relies on members only editing their own name. Execs can also fix or delete rows in the `Song Picks` tab of the sheet.

## Picking a song someone else listed

Under **Overlap in interest**, each song has **Make Top 1** and **Make Top 2** buttons. Choose your name at the top first, then tap one. It replaces that slot in your picks (your other pick stays) and shows "✓ Your Top 1/2" on the song. To remove your picks, clear both boxes and tap Save, or tap **Delete my picks**.

## Built-in guide and messages

- **?** (top right) opens a short step-by-step tour that highlights where to tap. It opens automatically the first time someone visits on a device, and can be reopened any time. Skip, Back and Next are available.
- Saved, deleted and error messages appear as a small bar at the bottom of the screen and fade after a few seconds. Delete confirmations appear as a small in-app box with Cancel and Delete.
- Buttons, tabs, cards, links and inputs have hover and keyboard-focus highlights.

## Semesters and "active" members

Statuses are **Active Fall, Active Winter, Active Summer, Hiatus and Left**. Lists of who is missing only include members whose status matches the semester:

- Fall: Sep to Dec periods (Sep–Oct, Nov–Dec)
- Winter: Jan to Apr periods (Jan–Feb, Mar–Apr)
- Summer: May to Aug periods (May–Jun, Jul–Aug)

The Availability tab and Home counts use today's semester. On Top 2 Picks, the name list, overlap list, "Still waiting on" list and Suggest tab all use only members who are **Active** for the semester of the period you selected (Nov–Dec = Fall, for example).

## Home-screen logo

Two files are included: `ck3-logo-512.png` and `ck3-logo-180.png` (a simple placeholder; swap in your own square PNG, 512 x 512).
1. Upload `ck3-logo-512.png` to Google Drive, set sharing to **Anyone with the link**, and build a link like `https://drive.google.com/uc?export=view&id=FILE_ID`.
2. Paste it into `LOGO_URL` at the top of `Code.gs`, then deploy a **new version**.
3. Android and desktop Chrome usually pick it up when someone adds the app to their home screen. **iPhones often ignore it** for Google web apps and show a plain letter or screenshot instead. This is a Google limitation, not something the code can fully override.

## Suggestion box

A small **💡 Suggest an improvement** link sits at the bottom of every tab. Dancers type a short message (up to 500 characters) and an optional name. It is saved as a new row in the **Suggestions** tab (Date, Name, Suggestion), which Execs can read in the sheet. To limit spam, only 10 suggestions are accepted per hour.

## Units tab

A "Work in progress" banner sits above the units, since units are still being finalized.

## Access code (keeps outsiders out)

Anyone who finds the app link first sees only a lock screen. No names, statuses, picks or availability are sent until the correct access code is entered.

1. One-time setup by the sheet owner: Apps Script → **Project Settings (gear) → Script properties → Add script property**. Name: `APP_CODE`, value: a code of 8+ characters. Share it only with members, for example in the Discord.
2. Deploy a **new version**. Until `APP_CODE` is set, the app stays locked and says the code is not set.
3. Members enter the code once. The device remembers it.
4. To change it (for example if it leaks), edit `APP_CODE`. Everyone is asked for the new code next time they open the app.
5. After 15 wrong guesses in 10 minutes, all code attempts are paused for 10 minutes.

This is a shared code, not individual logins: anyone who has it can get in, so change it when it spreads beyond the group.

## Home-screen wrapper on GitHub Pages

The wrapper folder (`homescreen-wrapper`) only shows the app full-screen and supplies the home-screen logo. It holds no member data. On a free GitHub account Pages sites are public, so anyone with that link sees the logo and the lock screen, but nothing else. Keep the Apps Script access set to **Anyone** so the wrapper can show it, and rely on the access code above.

# Latest Version
V18
