# Reverse Mario Leaderboard — Auto-update version

## Quick visual check
Open `index.html` in Chrome. It works in local demo mode and saves scores in that browser only.

## Start the shared local API (Windows CMD)
Open CMD in this folder and run:
```cmd
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload
```
Keep CMD open. Refresh `index.html`; it should say `CONNECTED TO PYTHON API`. The list automatically fetches fresh rankings every 5 seconds while the page is open.

## Connect the game score
At the point in your game's JavaScript where a level finishes and `finalScore` is known, call:
```javascript
window.submitReverseMarioScore(playerName, finalScore);
```
This helper exists on the leaderboard page itself. If the game is a separate HTML page, this function is not automatically available there; the game should POST to the same API instead:
```javascript
await fetch("http://127.0.0.1:8000/scores", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({ name: playerName, score: finalScore })
});
```
The leaderboard page polls `/leaderboard` every 5 seconds.

## Important limitations
- Local demo mode is only stored in the current browser; it is not shared across devices.
- For multiple players/devices, deploy the backend and use its public URL instead of `http://127.0.0.1:8000`.
- The Friends tab is a demo filter, not a real friend system.
- This starter has no authentication and trusts submitted scores. For public competition, validate scores server-side and use authenticated player IDs.
