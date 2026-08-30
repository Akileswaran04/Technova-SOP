/**
 * Automated demo script — seeds data, logs in, navigates all tabs, and takes screenshots.
 * Run: node demo.cjs
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Helper: click a button whose text content matches
async function clickButtonByText(page, text) {
  await page.evaluate((t) => {
    const buttons = [...document.querySelectorAll('button')];
    const btn = buttons.find(b => b.textContent.includes(t));
    if (btn) btn.click();
  }, text);
}

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // ── Step 1: Seed demo data ──
  console.log('1️⃣  Seeding demo data...');
  await page.goto(URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    const sellerId = 'seller_demo123';
    const seller = {
      id: sellerId, storeName: 'Sharma General Store', category: 'Grocery & Essentials',
      bio: 'Family-run grocery store serving the community since 2005. Fresh produce, daily essentials, and friendly service.',
      phone: '+91 98765 43210', email: 'sharma@store.com', address: 'Shop 5, Main Market, Jaipur',
      hours: 'Mon-Sat, 8 AM - 9 PM', avatarImage: null, documents: [], password: 'demo123',
      createdAt: new Date().toISOString()
    };
    const products = [
      { id: 'prod_1', sellerId, name: 'Organic Turmeric Powder', description: 'Premium quality organic turmeric from Kerala farms. 250g pack.', price: 149, image: null, stock: 45, lowStockThreshold: 10, likes: 24,
        reviews: [
          { id: 'rev_1', customerName: 'Priya Sharma', rating: 5, comment: 'Excellent quality! The color and aroma are amazing.', date: '2026-08-20T10:00:00Z', sellerReply: 'Thank you Priya! We source directly from Kerala farms.' },
          { id: 'rev_2', customerName: 'Rahul Kumar', rating: 4, comment: 'Good product, fast delivery. Slightly pricey but worth it.', date: '2026-08-22T14:30:00Z', sellerReply: null },
          { id: 'rev_3', customerName: 'Anita Devi', rating: 5, comment: 'Best turmeric I have used. Great for cooking and health.', date: '2026-08-25T09:15:00Z', sellerReply: null }
        ], createdAt: '2026-08-01T00:00:00Z' },
      { id: 'prod_2', sellerId, name: 'Basmati Rice Premium', description: 'Long grain basmati rice, aged 2 years. 5kg bag.', price: 599, image: null, stock: 3, lowStockThreshold: 10, likes: 18,
        reviews: [
          { id: 'rev_4', customerName: 'Rahul Kumar', rating: 5, comment: 'The best rice for biryani!', date: '2026-08-18T12:00:00Z', sellerReply: 'Glad you liked it Rahul!' },
          { id: 'rev_5', customerName: 'Meena Patel', rating: 4, comment: 'Very good quality. Packaging could be better.', date: '2026-08-21T16:45:00Z', sellerReply: null }
        ], createdAt: '2026-08-05T00:00:00Z' },
      { id: 'prod_3', sellerId, name: 'Fresh Cow Milk', description: 'Farm-fresh cow milk, pasteurized. 1 litre pack.', price: 62, image: null, stock: 0, lowStockThreshold: 15, likes: 42,
        reviews: [
          { id: 'rev_6', customerName: 'Anita Devi', rating: 3, comment: 'Milk is good but sometimes delivered late.', date: '2026-08-23T08:00:00Z', sellerReply: 'We are working on improving delivery times.' },
          { id: 'rev_7', customerName: 'Vikram Singh', rating: 5, comment: 'Pure and fresh every day.', date: '2026-08-26T07:30:00Z', sellerReply: null },
          { id: 'rev_8', customerName: 'Priya Sharma', rating: 4, comment: 'Good quality milk.', date: '2026-08-27T11:00:00Z', sellerReply: null }
        ], createdAt: '2026-08-10T00:00:00Z' },
      { id: 'prod_4', sellerId, name: 'Mustard Oil Cold Pressed', description: 'Traditional cold-pressed mustard oil. 1 litre.', price: 189, image: null, stock: 22, lowStockThreshold: 8, likes: 15,
        reviews: [{ id: 'rev_9', customerName: 'Meena Patel', rating: 5, comment: 'Authentic taste like homemade.', date: '2026-08-19T13:00:00Z', sellerReply: null }], createdAt: '2026-08-12T00:00:00Z' },
      { id: 'prod_5', sellerId, name: 'Toor Dal Premium', description: 'Unpolished toor dal, 1kg pack.', price: 175, image: null, stock: 8, lowStockThreshold: 10, likes: 11, reviews: [], createdAt: '2026-08-15T00:00:00Z' }
    ];
    const customers = [
      { id: 'cust_1', sellerId, name: 'Priya Sharma', contact: '+91 99887 76655', notes: 'Regular customer, prefers organic products', lastInteraction: '2026-08-27T11:00:00Z' },
      { id: 'cust_2', sellerId, name: 'Rahul Kumar', contact: 'rahul@email.com', notes: '', lastInteraction: '2026-08-22T14:30:00Z' },
      { id: 'cust_3', sellerId, name: 'Vikram Singh', contact: '+91 88776 65544', notes: 'Bulk buyer for restaurant', lastInteraction: '2026-08-26T07:30:00Z' }
    ];
    localStorage.setItem('msme_sellers', JSON.stringify([seller]));
    localStorage.setItem('msme_products', JSON.stringify(products));
    localStorage.setItem('msme_customers', JSON.stringify(customers));
  });

  // ── Step 2: Login ──
  console.log('2️⃣  Logging in...');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#identifier', { timeout: 5000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login.png'), fullPage: false });

  await page.type('#identifier', 'sharma@store.com');
  await page.type('#password', 'demo123');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_filled.png'), fullPage: false });

  await page.click('button[type="submit"]');
  await delay(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard_products.png'), fullPage: false });
  console.log('   ✅ Logged in — Products tab');

  // ── Step 3: Click a product card ──
  console.log('3️⃣  Opening product detail...');
  const productCard = await page.$('.grid button');
  if (productCard) {
    await productCard.click();
    await delay(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_product_detail.png'), fullPage: false });
    console.log('   ✅ Product detail modal');

    // Close modal by clicking backdrop
    const backdrop = await page.$('.absolute.inset-0.bg-inverse-surface\\/40');
    if (backdrop) {
      await backdrop.click({ offset: { x: 10, y: 10 } });
    } else {
      // fallback: press Escape
      await page.keyboard.press('Escape');
    }
    await delay(400);
  }

  // ── Step 4: Inventory tab ──
  console.log('4️⃣  Inventory tab...');
  await clickButtonByText(page, 'Inventory');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_inventory.png'), fullPage: false });
  console.log('   ✅ Inventory tab');

  // ── Step 5: Customers tab ──
  console.log('5️⃣  Customers tab...');
  await clickButtonByText(page, 'Customers');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_customers.png'), fullPage: false });
  console.log('   ✅ Customers tab');

  // ── Step 6: Profile tab ──
  console.log('6️⃣  Profile tab...');
  await clickButtonByText(page, 'Profile');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_profile.png'), fullPage: false });
  console.log('   ✅ Profile tab');

  // ── Step 7: Mobile view ──
  console.log('7️⃣  Mobile view...');
  await page.setViewport({ width: 390, height: 844 });
  await clickButtonByText(page, 'Products');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_products.png'), fullPage: false });
  console.log('   ✅ Mobile Products');

  await clickButtonByText(page, 'Inventory');
  await delay(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_inventory.png'), fullPage: false });
  console.log('   ✅ Mobile Inventory');

  // ── Done ──
  console.log('\n🎉 Demo complete! Screenshots:');
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => console.log('  📸', f));
  await browser.close();
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
