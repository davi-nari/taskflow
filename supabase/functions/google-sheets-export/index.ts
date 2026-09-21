
import { serve } from "https://deno.land/std/http/server.ts";
import { google } from "npm:googleapis";

serve(async () => {
  const credentials = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "{}");
  const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");
  const sheetName = Deno.env.get("GOOGLE_SHEET_NAME") || "TaskFlow";

  if (!spreadsheetId || !credentials.client_email) {
    return new Response(JSON.stringify({error:"Missing Google configuration"}), {status:500});
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes:["https://www.googleapis.com/auth/spreadsheets"]
  });

  // TODO: fetch today's exported actions from Supabase and append rows.
  // This function is prepared for cron execution at 18:20 Asia/Tashkent.

  const sheets = google.sheets({version:"v4", auth});
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range:`${sheetName}!A:G`,
    valueInputOption:"USER_ENTERED",
    requestBody:{values:[]}
  });

  return new Response(JSON.stringify({ok:true}), {headers:{"content-type":"application/json"}});
});
