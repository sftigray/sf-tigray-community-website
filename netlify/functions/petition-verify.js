exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const reply = (statusCode, success, message) => ({
    statusCode,
    headers,
    body: JSON.stringify({ success, message })
  });

  if (event.httpMethod !== "POST") {
    return reply(405, false, "Method not allowed.");
  }

  const scriptUrl = process.env.PETITION_SCRIPT_URL;
  const sharedSecret = process.env.PETITION_SHARED_SECRET;

  if (!scriptUrl || !sharedSecret) {
    return reply(503, false, "Verification service unavailable.");
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const token = String(data.token || "");

    if (!/^[0-9a-f-]{72}$/i.test(token)) {
      return reply(400, false, "Invalid verification link.");
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "verify",
        token: token,
        sharedSecret: sharedSecret
      })
    });

    if (!response.ok) {
      return reply(502, false, "Verification service unavailable.");
    }

    const result = await response.json();

    return reply(
      result.success === true ? 200 : 400,
      result.success === true,
      result.message || "Unable to verify signature."
    );

  } catch (error) {
    return reply(502, false, "Unable to verify right now. Please try again.");
  }
};
