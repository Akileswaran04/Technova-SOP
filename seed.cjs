const puppeteer = require('puppeteer');
const delay = ms => new Promise(r => setTimeout(r, ms));

const SEED_DATA = `
const id = 'seller_food001';
const seller = {
  id, storeName: 'FreshBasket Food Supply', category: 'Food & Beverages',
  bio: 'Your trusted wholesale food supplier since 2010. We source directly from farms and mills across India. Quality grains, spices, oils, and daily essentials at competitive wholesale prices. Serving 500+ retailers across Rajasthan.',
  phone: '+91 98290 12345', email: 'freshbasket@foodsupply.in',
  address: 'Godown No. 12, Foodgrain Market, Vidyadhar Nagar, Jaipur',
  hours: 'Mon-Sat, 7 AM - 6 PM | Sunday: 8 AM - 2 PM',
  avatarImage: null,
  documents: [
    { id: 'doc1', name: 'GST_Certificate_FreshBasket.pdf', dataUrl: '', uploadedAt: '2026-06-15T10:00:00Z', status: 'verified' },
    { id: 'doc2', name: 'FSSAI_License_2026.pdf', dataUrl: '', uploadedAt: '2026-07-01T12:00:00Z', status: 'verified' },
    { id: 'doc3', name: 'Shop_License_Renewal.pdf', dataUrl: '', uploadedAt: '2026-08-10T09:00:00Z', status: 'pending' }
  ],
  password: 'fresh123', createdAt: '2024-01-15T00:00:00Z'
};

const products = [
  { id:'f1', sellerId:id, name:'Basmati Rice (1121 Premium)', description:'Extra-long grain aged basmati rice. Ideal for biryani, pulao. 5kg pack. Sourced from Punjab.', price:699, image:null, stock:180, lowStockThreshold:50, likes:87,
    reviews:[
      {id:'fr1',customerName:'Rajesh Traders',rating:5,comment:'Best quality basmati we have found. Customers love it.',date:'2026-08-10T09:00:00Z',sellerReply:'Thank you Rajesh ji! Consistent quality for our partners.'},
      {id:'fr2',customerName:'Anita Provision Store',rating:5,comment:'Grains are extra long, exactly as promised. Fast delivery.',date:'2026-08-15T14:30:00Z',sellerReply:null},
      {id:'fr3',customerName:'Vikram General Store',rating:4,comment:'Good quality. Packaging could be more durable for bulk.',date:'2026-08-20T11:00:00Z',sellerReply:'Noted! Upgrading to reinforced PP bags next month.'}
    ], createdAt:'2026-01-10T00:00:00Z'},

  { id:'f2', sellerId:id, name:'Toor Dal (Unpolished)', description:'Premium unpolished toor dal. High protein, no additives. 15kg bag.', price:2150, image:null, stock:95, lowStockThreshold:30, likes:64,
    reviews:[
      {id:'fr4',customerName:'Meena Traders',rating:5,comment:'Purity is excellent. No stones, no dust.',date:'2026-08-12T10:00:00Z',sellerReply:'We triple-clean before packing.'},
      {id:'fr5',customerName:'Sharma & Sons Grocery',rating:4,comment:'Good dal but price slightly higher than Delhi suppliers.',date:'2026-08-18T16:00:00Z',sellerReply:'Our dal is unpolished and additive-free. Volume discounts available.'}
    ], createdAt:'2026-02-05T00:00:00Z'},

  { id:'f3', sellerId:id, name:'Cold-Pressed Mustard Oil', description:'Kachi ghani mustard oil. 15 litre tin. Authentic Rajasthani taste.', price:1890, image:null, stock:0, lowStockThreshold:20, likes:112,
    reviews:[
      {id:'fr6',customerName:'Goyal Kirana Store',rating:5,comment:'Best mustard oil. Customers prefer this brand only.',date:'2026-08-08T08:30:00Z',sellerReply:'Cold-pressed in traditional ghani. No chemicals.'},
      {id:'fr7',customerName:'Priya Departmental Store',rating:5,comment:'Aroma is incredible. Always fresh stock.',date:'2026-08-14T12:00:00Z',sellerReply:null},
      {id:'fr8',customerName:'Rajesh Traders',rating:4,comment:'Excellent product. Wish faster delivery in peak season.',date:'2026-08-22T15:00:00Z',sellerReply:'Adding second delivery vehicle soon.'}
    ], createdAt:'2026-01-20T00:00:00Z'},

  { id:'f4', sellerId:id, name:'Organic Turmeric Powder', description:'High-curcumin organic turmeric from Erode. 500g pouch.', price:245, image:null, stock:320, lowStockThreshold:80, likes:56,
    reviews:[
      {id:'fr9',customerName:'Anita Provision Store',rating:5,comment:'Deep yellow-orange color. High curcumin.',date:'2026-08-16T09:00:00Z',sellerReply:'Lab-tested 4%+ curcumin. Certificate on request.'},
      {id:'fr10',customerName:'Meena Traders',rating:5,comment:'Retail-ready packaging. Customers love organic label.',date:'2026-08-24T11:30:00Z',sellerReply:null}
    ], createdAt:'2026-03-01T00:00:00Z'},

  { id:'f5', sellerId:id, name:'Whole Wheat Atta (Chakki Fresh)', description:'Freshly stone-ground wheat flour. No maida mix. 10kg bag.', price:480, image:null, stock:250, lowStockThreshold:60, likes:93,
    reviews:[
      {id:'fr11',customerName:'Sharma & Sons Grocery',rating:5,comment:'Rotis are soft and fluffy. Sells fast.',date:'2026-08-05T10:00:00Z',sellerReply:'Chakki-fresh means maximum nutrition.'},
      {id:'fr12',customerName:'Vikram General Store',rating:4,comment:'Good quality. Wish we had 5kg pack option.',date:'2026-08-19T14:00:00Z',sellerReply:'We now offer 5kg packs too!'}
    ], createdAt:'2026-02-15T00:00:00Z'},

  { id:'f6', sellerId:id, name:'Red Chilli Powder (Kashmiri)', description:'Premium Kashmiri red chilli. Deep colour, moderate heat. 1kg pack.', price:520, image:null, stock:42, lowStockThreshold:25, likes:41,
    reviews:[
      {id:'fr13',customerName:'Goyal Kirana Store',rating:5,comment:'Perfect colour for restaurant customers.',date:'2026-08-11T13:00:00Z',sellerReply:'Kashmiri chillies give colour without excessive heat.'},
      {id:'fr14',customerName:'Anita Provision Store',rating:3,comment:'Last batch slightly less pungent.',date:'2026-08-25T09:30:00Z',sellerReply:'Batch variation with natural crops. Will ensure consistency.'}
    ], createdAt:'2026-04-10T00:00:00Z'},

  { id:'f7', sellerId:id, name:'Refined Sunflower Oil', description:'Fortified sunflower oil. 15 litre tin. Vitamin A & D enriched.', price:1650, image:null, stock:120, lowStockThreshold:30, likes:78,
    reviews:[
      {id:'fr15',customerName:'Priya Departmental Store',rating:5,comment:'Staple product. Always fresh.',date:'2026-08-13T11:00:00Z',sellerReply:'FIFO management ensures freshness.'},
      {id:'fr16',customerName:'Rajesh Traders',rating:4,comment:'Good oil. Delivery was late last time.',date:'2026-08-21T16:30:00Z',sellerReply:'Apologies. Adding route optimization for better punctuality.'}
    ], createdAt:'2026-03-20T00:00:00Z'},

  { id:'f8', sellerId:id, name:'Sugar (Refined)', description:'ICUMSA 45 refined white sugar. 50kg bag. Direct from mill.', price:3200, image:null, stock:85, lowStockThreshold:20, likes:35,
    reviews:[], createdAt:'2026-05-01T00:00:00Z'},

  { id:'f9', sellerId:id, name:'Chana Dal (Desi)', description:'Desi chana dal for snacks and cooking. 15kg bag.', price:1800, image:null, stock:60, lowStockThreshold:20, likes:29,
    reviews:[
      {id:'fr17',customerName:'Meena Traders',rating:4,comment:'Good for besan and ladoos.',date:'2026-08-17T10:30:00Z',sellerReply:'Desi chana dal has better taste and nutrition.'}
    ], createdAt:'2026-04-15T00:00:00Z'},

  { id:'f10', sellerId:id, name:'Table Salt (Iodised)', description:'Double-iodised free-flowing salt. 25kg bag.', price:420, image:null, stock:5, lowStockThreshold:15, likes:18,
    reviews:[], createdAt:'2026-06-01T00:00:00Z'},

  { id:'f11', sellerId:id, name:'Ghee (A2 Desi Cow)', description:'A2 bilona ghee from Gir cow milk. 1 litre jar.', price:899, image:null, stock:35, lowStockThreshold:10, likes:67,
    reviews:[
      {id:'fr18',customerName:'Priya Departmental Store',rating:5,comment:'Premium product. Aroma is divine.',date:'2026-08-23T08:00:00Z',sellerReply:'Traditional bilona method retains all nutrients.'},
      {id:'fr19',customerName:'Sharma & Sons Grocery',rating:5,comment:'Sells like hotcakes. Repeat orders weekly.',date:'2026-08-26T14:00:00Z',sellerReply:null}
    ], createdAt:'2026-05-10T00:00:00Z'},

  { id:'f12', sellerId:id, name:'Moong Dal (Split)', description:'Premium split moong dal. Easy to cook. 15kg bag.', price:2400, image:null, stock:70, lowStockThreshold:25, likes:44,
    reviews:[
      {id:'fr20',customerName:'Goyal Kirana Store',rating:4,comment:'Good quality. Consistent across batches.',date:'2026-08-09T12:00:00Z',sellerReply:'Quality control is our priority.'}
    ], createdAt:'2026-03-10T00:00:00Z'}
];

const customers = [
  {id:'cu1',sellerId:id,name:'Rajesh Traders',contact:'+91 98280 55555',notes:'Largest retailer in MI Road. Orders weekly. Prefers premium.',lastInteraction:'2026-08-22T15:00:00Z'},
  {id:'cu2',sellerId:id,name:'Anita Provision Store',contact:'+91 99281 66666',notes:'Medium retailer in Malviya Nagar. Bi-weekly orders.',lastInteraction:'2026-08-25T09:30:00Z'},
  {id:'cu3',sellerId:id,name:'Vikram General Store',contact:'+91 98290 77777',notes:'Small shop in Mansarovar. Monthly orders. Price-sensitive.',lastInteraction:'2026-08-20T11:00:00Z'},
  {id:'cu4',sellerId:id,name:'Meena Traders',contact:'+91 97990 88888',notes:'Wholesale distributor to smaller shops in Tonk area.',lastInteraction:'2026-08-24T11:30:00Z'},
  {id:'cu5',sellerId:id,name:'Goyal Kirana Store',contact:'+91 98290 99999',notes:'Premium segment store in C-Scheme. Organic and A2 focus.',lastInteraction:'2026-08-26T14:00:00Z'},
  {id:'cu6',sellerId:id,name:'Sharma & Sons Grocery',contact:'sharma.sons@email.com',notes:'Old customer since 2012. Reliable payment.',lastInteraction:'2026-08-26T14:00:00Z'},
  {id:'cu7',sellerId:id,name:'Priya Departmental Store',contact:'+91 97991 11111',notes:'New customer since 2026. Growing fast.',lastInteraction:'2026-08-26T14:00:00Z'},
  {id:'cu8',sellerId:id,name:'Sunrise Hotels & Catering',contact:'+91 98290 22222',notes:'Bulk buyer for hotel kitchen. Pay via cheque.',lastInteraction:'2026-08-15T10:00:00Z'}
];

localStorage.setItem('msme_sellers', JSON.stringify([seller]));
localStorage.setItem('msme_products', JSON.stringify(products));
localStorage.setItem('msme_customers', JSON.stringify(customers));
localStorage.setItem('msme_session', JSON.stringify({loggedInSellerId: id}));
`;

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  await page.evaluate(SEED_DATA);
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1500);

  const text = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText.substring(0, 150) : document.body.innerText.substring(0, 150);
  });
  console.log('Dashboard loaded:', text.replace(/\n/g, ' | '));
  console.log('\nOpen http://localhost:5173 in your browser');
  console.log('Login: freshbasket@foodsupply.in / fresh123');

  await browser.close();
})().catch(e => console.error('Error:', e.message));
