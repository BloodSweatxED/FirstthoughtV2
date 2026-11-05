# Connect First Thought to Google Sheets

This takes about 10 minutes. You need a Google account. A personal account is the simplest choice, because many school accounts block the sharing setting in step 4.

## 1. Make the Sheet

Create a blank Google Sheet. Name it something like "First Thought data". You don't need to add tabs or headers. The script creates them the first time someone uses a room.

## 2. Add the script

In the Sheet, open **Extensions → Apps Script**. Delete the sample code in the editor. Paste in the whole of `apps-script/Code.gs` from this repo. Click the save icon.

## 3. Deploy it as a web app

Click **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**. Then set:

- Description: `First Thought`
- Execute as: **Me**
- Who has access: **Anyone**

Click **Deploy**.

## 4. Approve access

Google asks you to authorize the script. Choose your account. Google will warn that the app isn't verified. That's expected for a script you wrote for yourself. Click **Advanced**, then **Go to First Thought (unsafe)**, then **Allow**.

The script can only read and write the Sheet it's attached to.

If "Anyone" isn't offered under "Who has access," your account's administrator has blocked it. Use a personal Google account instead.

## 5. Copy the URL

Copy the **Web app URL**. It ends in `/exec`.

To check that it works, open this in a browser, replacing the start with your URL:

```
https://script.google.com/macros/s/.../exec?action=getRoom&code=TEST
```

You should see `{"room":null,"ok":true}`.

## 6. Point the site at it

In Netlify, go to **Site configuration → Environment variables** and add:

- Key: `VITE_SHEETS_URL`
- Value: the URL from step 5

Then go to **Deploys → Trigger deploy → Deploy site**. When it finishes, the home page no longer shows the yellow "Demo mode" banner.

The URL isn't a secret. Anyone with it can reach the same endpoints the site uses, and nothing else. Room changes still need a room's host key.

## Updating the script later

If `Code.gs` changes, paste the new version and save it. Then go to **Deploy → Manage deployments**, click the pencil, set Version to **New version**, and click **Deploy**. The URL stays the same.

## What the Sheet stores

- `rooms`: room code, room name, level, current case and round, whether answers are revealed, and the host key.
- `responses`: time, room code, round, a random learner id that changes every round, case, level, and the answer text.

There are no names, emails, or device identifiers. To clear the data, delete rows. Keep the header row.

## Limits

Each request takes 1 to 3 seconds. The host screen updates about every 3 seconds. Apps Script handles about 30 requests at once, which is far more than a group of 6 needs.

## Rehearse without Google

`scripts/fake-apps-script.mjs` runs the same `Code.gs` on your computer with an in-memory Sheet:

```bash
node scripts/fake-apps-script.mjs 8787
VITE_SHEETS_URL=http://localhost:8787/exec npx vite build --outDir dist-rehearse
npx vite preview --outDir dist-rehearse --host
```

Phones on the same Wi-Fi can join at the network address `vite preview` prints. Stopping the fake server deletes the data.
