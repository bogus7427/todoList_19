# GeminiBot

The to-do list and GeminiBot run on a small local Node.js server. The Gemini API key stays on the server and is never sent to the browser.

## Run locally

1. Install Node.js 18.17 or newer.
2. Create a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey).
3. In PowerShell, set the key and start the app:

   ```powershell
   $env:GEMINI_API_KEY = "YOUR_API_KEY"
   npm start
   ```

4. Open <http://127.0.0.1:3000>.

The app uses `gemini-3.8-flash` by default. To choose another model, set `GEMINI_MODEL` before starting the server. Messages are sent to the Gemini API when you chat and are kept in the browser only for the current page session.
