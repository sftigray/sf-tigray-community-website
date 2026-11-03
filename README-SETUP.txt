SF Tigray Community automatic gallery

This ZIP contains a Netlify Function. Drag-and-drop manual deployment may not build or deploy the function. Connect the EXISTING Netlify site to a GitHub repository containing these extracted files, then deploy from Git. Do not create a second Netlify site.

Required Netlify environment variables (set privately): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. For variables entered in production-only context, the production function will use them.

Cloudinary folder: SF-Tigray-Community/Community-gallery (case sensitive). Photos in this folder are considered approved for publication.

Test: visit https://sftigraycommunity.org/.netlify/functions/community-gallery after a Git deployment; expected JSON containing photos. If 404, the function has not deployed. If 503, credentials are missing. If 502, check Netlify function logs and folder name/permissions.

The original Axum photo remains visible if the service is unavailable. Gallery updates appear on page refresh; API response is cached briefly.
