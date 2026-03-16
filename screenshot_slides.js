const playwright = require('playwright');
const path = require('path');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const htmlPath = 'file:///' + path.resolve(__dirname, '汇报/AI研发提效总结.html').replace(/\\/g, '/');
  console.log('Opening:', htmlPath);
  
  await page.goto(htmlPath);
  await page.waitForTimeout(2000); // Wait for animations

  // Take screenshot of slide 1
  console.log('Taking screenshot of slide 1...');
  await page.screenshot({ 
    path: '汇报/slide1_screenshot.png',
    fullPage: false
  });

  // Get position info for slide 1
  const slide1Info = await page.evaluate(() => {
    const slide = document.querySelector('#s1');
    const title = slide.querySelector('h1');
    const slideRect = slide.getBoundingClientRect();
    const titleRect = title ? title.getBoundingClientRect() : null;
    const content = slide.querySelector('.slide-content');
    const contentRect = content ? content.getBoundingClientRect() : null;
    
    return {
      slideHeight: slideRect.height,
      slideTop: slideRect.top,
      titleY: titleRect ? titleRect.top : null,
      titleHeight: titleRect ? titleRect.height : null,
      contentY: contentRect ? contentRect.top : null,
      contentHeight: contentRect ? contentRect.height : null,
      contentBottom: contentRect ? contentRect.bottom : null,
      spaceAbove: contentRect ? contentRect.top : null,
      spaceBelow: contentRect ? (slideRect.bottom - contentRect.bottom) : null,
      justifyContent: content ? window.getComputedStyle(content).justifyContent : null,
      alignItems: content ? window.getComputedStyle(content).alignItems : null
    };
  });
  
  console.log('Slide 1 measurements:', JSON.stringify(slide1Info, null, 2));

  // Scroll to slide 2
  console.log('Scrolling to slide 2...');
  await page.evaluate(() => {
    document.querySelector('#s2').scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // Take screenshot of slide 2
  console.log('Taking screenshot of slide 2...');
  await page.screenshot({ 
    path: '汇报/slide2_screenshot.png',
    fullPage: false
  });

  // Get position info for slide 2
  const slide2Info = await page.evaluate(() => {
    const slide = document.querySelector('#s2');
    const elements = slide.querySelectorAll('*');
    const overlaps = [];
    
    // Check for overlapping elements
    for (let i = 0; i < elements.length; i++) {
      const rect1 = elements[i].getBoundingClientRect();
      for (let j = i + 1; j < elements.length; j++) {
        const rect2 = elements[j].getBoundingClientRect();
        
        // Check if rectangles overlap
        if (!(rect1.right < rect2.left || 
              rect1.left > rect2.right || 
              rect1.bottom < rect2.top || 
              rect1.top > rect2.bottom)) {
          
          // Check if one contains the other (normal parent-child)
          const contains = elements[i].contains(elements[j]) || elements[j].contains(elements[i]);
          
          if (!contains && rect1.width > 0 && rect1.height > 0 && rect2.width > 0 && rect2.height > 0) {
            overlaps.push({
              element1: elements[i].tagName + (elements[i].className ? '.' + elements[i].className.split(' ')[0] : ''),
              element2: elements[j].tagName + (elements[j].className ? '.' + elements[j].className.split(' ')[0] : ''),
              rect1: { top: rect1.top, left: rect1.left, bottom: rect1.bottom, right: rect1.right },
              rect2: { top: rect2.top, left: rect2.left, bottom: rect2.bottom, right: rect2.right }
            });
          }
        }
      }
    }
    
    return {
      overlaps: overlaps.slice(0, 10), // Limit to first 10
      overlapCount: overlaps.length
    };
  });
  
  console.log('Slide 2 overlaps:', JSON.stringify(slide2Info, null, 2));

  await browser.close();
  console.log('Screenshots saved!');
})();
