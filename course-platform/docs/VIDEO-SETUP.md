# Protected videos: setup

No monthly fee. Google Drive is where you drop videos; GitHub turns them into locked streams; Cloudflare R2 stores them; our website hands out the keys.

## What you get

1. **Locked video.** Each video is cut into 6-second pieces, each locked with its own key. No download button; download tools get scrambled files.
2. **Keys only for paying students.** A key works for one signed-in student, one video, for a short time.
3. **Ripping as slow as watching.** Keys are released at about the speed of playback, so copying a video takes as long as watching it.
4. **Hidden fingerprint per student.** Every student's copy is invisibly different. If a copy leaks, we can name the student (`scripts/video/trace-leak.ts`).
5. **Moving name on screen.** Screen recordings show the student's name and email.
6. **Three qualities** (1080p, 720p, 480p), switched automatically so it doesn't stall on mobile data.

Not included: turning screen recordings black. That needs a paid DRM licence (see "Screen-recording blocking" below). Nothing can stop someone filming the screen with a phone. The name watermark covers that.

## Costs

- Cloudflare R2: free up to 10 GB. About 2 h of video × 3 qualities × 2 fingerprint copies ≈ 5–8 GB. Streaming to students is free. Cloudflare asks for a card when you turn R2 on, but charges $0 under these limits.
- GitHub Actions: free minutes; packaging all videos once uses a few hundred.

## One-time setup (about 15 minutes)

**1. Cloudflare (storage)**
1. Sign up at dash.cloudflare.com (free).
2. Left menu → **R2 Object Storage** → turn it on (add the card) → **Create bucket** → name it `the-prod-videos`.
3. Open the bucket → **Settings** → **Public access** → **R2.dev subdomain** → Allow. Copy the `https://pub-….r2.dev` link (for the website later).
4. Back on the R2 page → **Manage API tokens** → **Create API token** → permission **Object Read & Write**, apply to the `the-prod-videos` bucket → Create. Copy the **Access Key ID** and **Secret Access Key**. Also copy your **Account ID** (shown on the R2 page).

**2. GitHub (the packaging robot)**
In the repo on github.com: **Settings → Secrets and variables → Actions → New repository secret**. Add five:

| Name | Value |
|---|---|
| `VIDEO_SECRET` | 40+ random characters from a password generator. Keep a copy: the website needs the same value. |
| `R2_ACCOUNT_ID` | Account ID |
| `R2_ACCESS_KEY_ID` | Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key |
| `R2_BUCKET` | `the-prod-videos` |

**3. Website (when we host it)**: set `VIDEO_SECRET` (same value) and `VIDEO_CDN_URL` (the `https://pub-….r2.dev` link) in the hosting settings.

## Uploading videos (the few-clicks part)

1. Install **Google Drive for desktop**. It uploads in the background and carries on if the internet drops.
2. In Drive, make a folder **THE PROD videos**. Drag the videos in.
3. Start each file name with its number: `2.3 Camera sensor.mp4`, `6.2 Two lights setup.mp4`.
4. Share the folder: **Anyone with the link → Viewer**. Send Claude the link once.

Then Claude runs the **Package videos** job (GitHub → Actions tab shows progress). It also runs every night by itself and picks up new files. To replace a video, upload the new file (same number, delete the old one) and it's redone on the next run.

## Screen-recording blocking (optional, paid)

Needs a DRM service. Cheapest fit: **VdoCipher**, prepaid yearly by data streamed (Starter ≈ $149/yr for 1 TB ≈ 400 students; Express ≈ $699/yr for 5 TB ≈ 2,000 students). Blocks recording on iPhone, iPad, Mac Safari, most Android phones and Edge on Windows. Desktop Chrome and Firefox can't be blocked by anyone; we can ask those viewers to use Edge or Safari. Switching the player over takes about a day.
