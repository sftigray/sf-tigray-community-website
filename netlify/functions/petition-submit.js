
exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json" };

  const reply = (statusCode, message) => ({
    statusCode,
    headers,
    body: JSON.stringify({ success: false, message })
  });

  if (event.httpMethod !== "POST") {
    return {
      ...reply(405, "Method not allowed."),
      headers: { ...headers, Allow: "POST" }
    };
  }

  // Keep submissions disabled during connection testing.
  const PETITION_TEST_MODE = true;

  if (PETITION_TEST_MODE) {
    return reply(503, "Petition submissions are not enabled yet.");
  }

  const scriptUrl = process.env.PETITION_SCRIPT_URL;
const sharedSecret = process.env.PETITION_SHARED_SECRET;
  if (!sharedSecret) {
  return reply(503, "Petition security is not configured.");
}
  if (!scriptUrl) {
    return reply(503, "Petition service is not configured.");
  }

  // A secure submission handler will be added after testing.
  return reply(503, "Petition connection is not yet activated.");
};
