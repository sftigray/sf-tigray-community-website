// Server-side only: Cloudinary credentials never appear in browser responses.
const FOLDER = 'SF-Tigray-Community/Community-gallery';
exports.handler = async () => {
  const {CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret} = process.env;
  if (!cloud || !key || !secret) return {statusCode:503,body:JSON.stringify({error:'Gallery not configured'})};
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/resources/search`, {
      method:'POST',
      headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},
      body:JSON.stringify({expression:`asset_folder="${FOLDER}" AND resource_type:image AND type:upload`,sort_by:[{created_at:'desc'}],max_results:100})
    });
    if (!response.ok) throw new Error(`Cloudinary ${response.status}`);
    const result = await response.json();
    const photos = (result.resources || []).filter(x=>x.secure_url && x.resource_type==='image' && x.type==='upload')
      .map(x=>({url:x.secure_url,alt:'Community photo',caption:'Community photo'}));
    return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=60'},body:JSON.stringify({photos})};
  } catch(e) {
    console.error('Community gallery fetch failed',e.message);
    return {statusCode:502,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'Gallery temporarily unavailable'})};
  }
};
