const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/product', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.includes('technosun.ir')) {
    return res.status(400).json({ error: 'لینک نامعتبر یا غیر technosun.ir' });
  }

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const data = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText || '';
      const sku = document.querySelector('h2')?.innerText || '';
      const priceMatch = document.body.innerText.match(/([\d\,]+)\s*تومان/);
      const price = priceMatch ? priceMatch[1].replace(/\,/g, '') : '0';

      const features = (() => {
        const h6s = Array.from(document.querySelectorAll('h6'));
        const target = h6s.find(el => el.innerText.includes('ویژگی'));
        if (!target) return [];
        const container = target.nextElementSibling;
        if (!container) return [];
        return Array.from(container.querySelectorAll('div.flex')).map(d => d.innerText.trim());
      })();

      const desc = (() => {
        const el = Array.from(document.querySelectorAll('div')).find(d =>
          d.innerText?.includes('نقد و بررسی')
        );
        return el?.innerText || '';
      })();

      const images = Array.from(document.querySelectorAll('.main-s-s img')).map(img => img.src);

      return { title, sku, price, features, description: desc, images };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '🚨 خطا در پردازش صفحه', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});