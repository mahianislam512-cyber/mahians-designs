// Shared photo categories — website + admin
window.PHOTO_CATEGORIES = [
  { key:'brand',  name:'Branding' },
  { key:'social', name:'Social Media', subs:[
      { key:'facebook',  name:'Facebook' },
      { key:'youtube',   name:'YouTube' },
      { key:'instagram', name:'Instagram' },
      { key:'tiktok',    name:'TikTok' },
      { key:'linkedin',  name:'LinkedIn' },
      { key:'x',         name:'X (Twitter)' },
      { key:'pinterest', name:'Pinterest' },
      { key:'whatsapp',  name:'WhatsApp' },
      { key:'other',     name:'Other' } ] },
  { key:'gaming', name:'Gaming', subs:[
      { key:'logo',      name:'Gaming Logo / Mascot' },
      { key:'banner',    name:'Banner / Header' },
      { key:'thumbnail', name:'Stream Thumbnail' },
      { key:'overlay',   name:'Stream Overlay' },
      { key:'poster',    name:'Tournament Poster' },
      { key:'emote',     name:'Emotes / Badges' },
      { key:'other',     name:'Other' } ] },
  { key:'print',  name:'Print' },
  { key:'ui',     name:'UI / Web' },
];
window.catName = k => (window.PHOTO_CATEGORIES.find(c=>c.key===k)||{}).name || k;
window.subName = (k,s) => { const c=window.PHOTO_CATEGORIES.find(c=>c.key===k); const x=c&&c.subs&&c.subs.find(x=>x.key===s); return x?x.name:''; };
