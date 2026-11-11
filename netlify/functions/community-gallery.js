
// Server-side only: Cloudinary credentials stay private.
const FOLDER = 'SF-Tigray-Community/Community-gallery';

exports.handler = async () => {
  const {
    CLOUDINARY_CLOUD_NAME: cloud,
    CLOUDINARY_API_KEY: key,
    CLOUDINARY_API_SECRET: secret
  } = process.env;

  if (!cloud || !key || !secret) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: 'Gallery not configured' })
    };
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  try {
    async function getAssets(resourceType) {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/resources/search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            expression: `asset_folder="${FOLDER}" AND resource_type:${resourceType} AND type:upload`,
            sort_by: [{ created_at: 'desc' }],
            max_results: 100
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary ${response.status}`);
      }

      const result = await response.json();
      return (result.resources || []).filter(
        x => x.secure_url &&
          x.resource_type === resourceType &&
          x.type === 'upload'
      );
    }

    const [images, videos] = await Promise.all([
      getAssets('image'),
      getAssets('video')
    ]);

    const photos = images.map(x => ({
      url: x.secure_url,
      alt: 'Community photo',
      caption: 'Community photo'
    }));

    const videoItems = videos.map(x => ({
      url: x.secure_url,
      type: 'video',
      caption: 'Community video'
    }));

    const media = [
      ...images.map(x => ({
        url: x.secure_url,
        type: 'image',
        caption: 'Community photo',
        created_at: x.created_at
      })),
      ...videos.map(x => ({
        url: x.secure_url,
        type: 'video',
        caption: 'Community video',
        created_at: x.created_at
      }))
    ].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      },
      body: JSON.stringify({
        photos,
        videos: videoItems,
        media
      })
    };

  } catch (e) {
    console.error('Community gallery fetch failed', e.message);

    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Gallery temporarily unavailable'
      })
    };
  }
};
