// Eden Life Academy — email relay
//
// Deploy this as a Google Apps Script Web App under the Google/Workspace
// account that owns communications@edenlifeng.org (or an account with that
// address set up as a Gmail "Send mail as" alias). The app's server calls
// this endpoint over HTTPS instead of connecting to SMTP directly.
//
// Setup:
//   1. https://script.google.com -> New project -> paste this file in as Code.gs
//   2. Project Settings -> Script Properties -> add SHARED_SECRET with a long random value
//   3. Deploy -> New deployment -> type "Web app"
//        Execute as: Me
//        Who has access: Anyone
//      Copy the resulting /exec URL.
//   4. On first real send, Google will prompt to authorize Gmail access — accept it.
//   5. In the app's environment, set:
//        GOOGLE_SCRIPT_URL    = the /exec URL from step 3
//        GOOGLE_SCRIPT_SECRET = the same value as SHARED_SECRET from step 2
//
// If communications@edenlifeng.org is a "Send mail as" alias on the account
// running this script (Gmail Settings -> Accounts -> Send mail as), pass
// that address as fromAddress in the request body to send as that alias.
// Otherwise mail is sent from whichever account owns the script.

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'Invalid JSON body' });
  }

  var expectedSecret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expectedSecret || body.secret !== expectedSecret) {
    return jsonResponse({ error: 'Unauthorized' });
  }

  if (!body.to || !body.subject || !body.html) {
    return jsonResponse({ error: 'Missing required field: to, subject, or html' });
  }

  try {
    var options = {
      htmlBody: body.html,
      name: body.fromName || 'Eden Life Academy',
    };
    if (body.fromAddress) options.from = body.fromAddress;

    GmailApp.sendEmail(body.to, body.subject, stripHtml(body.html), options);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
