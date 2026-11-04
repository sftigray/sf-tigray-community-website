const crypto = require("node:crypto");

const SITE = "https://sftigraycommunity.org";
const CALLBACK = `${SITE}/api/auth/callback`;

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const reply = (statusCode, body, extra = {}) => ({
    statusCode,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      ...extra,
    },
    body,
  });

  if (!clientId || !clientSecret) {
    return reply(500, "GitHub login settings are missing.");
  }

  if (query.error) {
    return reply(400, "GitHub login was canceled. Close this window and try again.");
  }

  if (!query.code) {
    const state = crypto.randomBytes(32).toString("hex");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: CALLBACK,
      scope: "repo",
      state,
    });

    return reply(302, "", {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    });
  }

  const cookies = event.headers.cookie || event.headers.Cookie || "";
  const savedState = cookies.match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];

  if (!savedState || query.state !== savedState) {
    return reply(400, "Login expired. Close this window and try logging in again.");
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: query.code,
          redirect_uri: CALLBACK,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      return reply(502, "GitHub login failed. Close this window and try again.");
    }

    const message = JSON.stringify(
      "authorization:github:success:" +
        JSON.stringify({ token: data.access_token, provider: "github" })
    ).replace(/</g, "\\u003c");

    return reply(
      200,
      `<!doctype html>
<html>
<body>
<p>Completing login…</p>
<script>
  const origin = ${JSON.stringify(SITE)};
  window.addEventListener("message", function receive(event) {
    if (event.origin !== origin || event.source !== window.opener) return;
    window.removeEventListener("message", receive);
    window.opener.postMessage(${message}, origin);
  });
  if (window.opener) {
    window.opener.postMessage("authorizing:github", origin);
  }
</script>
</body>
</html>`,
      {
        "Set-Cookie": "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
        "Referrer-Policy": "no-referrer",
      }
    );
  } catch {
    return reply(502, "Unable to contact GitHub. Please try again.");
  }
};
