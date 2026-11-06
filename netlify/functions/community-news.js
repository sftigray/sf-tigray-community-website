
const OWNER = "sftigray";
const REPO = "sf-tigray-community-website";

exports.handler = async function () {
  try {
    const url =
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/content/news?ref=main`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "SF-Tigray-Community"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const files = await response.json();
    const markdownFiles = files.filter(
      file => file.type === "file" && file.name.endsWith(".md")
    );

    const announcements = await Promise.all(
      markdownFiles.map(async file => {
        const result = await fetch(file.download_url);
        if (!result.ok) throw new Error("Cannot load announcement");

        const markdown = await result.text();
        const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
        const metadata = {};

        if (match) {
          for (const line of match[1].split(/\r?\n/)) {
            const field = line.match(/^([\w-]+):\s*(.*)$/);
            if (field) {
              metadata[field[1]] = field[2]
                .trim()
                .replace(/^["']|["']$/g, "");
            }
          }
        }

        return {
          title: metadata.title || file.name.replace(/\.md$/, ""),
          date: metadata.date || "",
          description: metadata.description || "",
          body: match ? markdown.slice(match[0].length).trim() : markdown.trim()
        };
      })
    );

    announcements.sort(
      (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ announcements })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unable to load community news" })
    };
  }
};
