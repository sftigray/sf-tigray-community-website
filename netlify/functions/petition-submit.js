exports.handler = async function (event) {
   if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Allow": "POST"
      },
      body: JSON.stringify({
        success: false,
        message: "Method not allowed."
      })
    };
  }
  return {
    statusCode: 503,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success: false,
      message: "Petition submissions are not enabled yet."
    })
  };
};
