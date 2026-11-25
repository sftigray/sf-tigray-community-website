
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
  const PETITION_TEST_MODE = false;
const PETITION_PRIVATE_TEST_TOKEN = process.env.PETITION_PRIVATE_TEST_TOKEN;
  if (PETITION_TEST_MODE) {
    const isPreview = process.env.PETITION_PREVIEW_ENABLED === "true";
  const suppliedToken =
    event.headers?.["x-petition-test-token"] ||
    event.headers?.["X-Petition-Test-Token"];
    if (isPreview) {
      console.info("Petition private test check:", {
        headerPresent: typeof suppliedToken === "string",
        suppliedLength: typeof suppliedToken === "string" ? suppliedToken.length : 0,
        configuredLength: PETITION_PRIVATE_TEST_TOKEN?.length ?? 0,
        tokenMatches: Boolean(PETITION_PRIVATE_TEST_TOKEN && suppliedToken === PETITION_PRIVATE_TEST_TOKEN)
      });
    } 
    if (
    !isPreview ||
    !PETITION_PRIVATE_TEST_TOKEN ||
    suppliedToken !== PETITION_PRIVATE_TEST_TOKEN
  ) {
    return reply(503, "Petition submissions are not enabled yet.");
  }
}

  const scriptUrl = process.env.PETITION_SCRIPT_URL;
const sharedSecret = process.env.PETITION_SHARED_SECRET;
  if (!sharedSecret) {
  return reply(503, "Petition security is not configured.");
}
  if (!scriptUrl) {
    return reply(503, "Petition service is not configured.");
  }

  try {
  const data = JSON.parse(event.body || "{}");

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      city: data.city,
      state: data.state,
      consent: data.consent === true,
      sharedSecret: sharedSecret
    })
  });

  if (!response.ok) {
    return reply(502, "Petition service unavailable.");
  }

  const result = await response.json();
    
    if (result.success !== true) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(result)
      };
    }


  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
} catch (error) {
  return reply(502, "Unable to process petition submission.");
}
  
};
