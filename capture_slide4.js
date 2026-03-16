const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Navigate to the HTML file
  const filePath = path.resolve('F:/chargo_order/汇报/AI研发提效总结.html');
  await page.goto(`file:///${filePath.replace(/\\/g, '/')}`);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Try to navigate to slide 4
  // The slides are likely using anchor navigation or scroll-based sections
  // First, let's check if there are navigation controls or if we need to scroll
  
  // Try common methods to get to slide 4:
  // 1. Check for anchor links
  const slide4Link = await page.locator('a[href="#slide-4"], a[href="#4"]').first();
  if (await slide4Link.count() > 0) {
    await slide4Link.click();
    await page.waitForTimeout(1000);
  } else {
    // 2. Try pressing arrow key or Page Down 3 times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(500);
    }
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'F:/chargo_order/汇报/slide4_screenshot.png',
    fullPage: false 
  });
  
  // Get the slide content for analysis
  const slideContent = await page.locator('.slide, section').nth(3).textContent().catch(() => '');
  console.log('Slide content preview:', slideContent.substring(0, 200));
  
  await browser.close();
  console.log('Screenshot saved to: F:/chargo_order/汇报/slide4_screenshot.png');
})();
