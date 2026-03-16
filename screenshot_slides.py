"""
Screenshot HTML slides with Playwright at 960x540 viewport
"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

# Set UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

slides = [
    ("s01.html", "file:///f:/chargo_order/汇报/pptx-workspace/slides/s01.html"),
    ("s04.html", "file:///f:/chargo_order/汇报/pptx-workspace/slides/s04.html"),
    ("s10.html", "file:///f:/chargo_order/汇报/pptx-workspace/slides/s10.html"),
    ("s11.html", "file:///f:/chargo_order/汇报/pptx-workspace/slides/s11.html"),
]

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 960, 'height': 540})
        page = context.new_page()
        
        for slide_name, url in slides:
            print(f"\n{'='*60}")
            print(f"Processing: {slide_name}")
            print(f"URL: {url}")
            print('='*60)
            
            try:
                page.goto(url, wait_until='networkidle', timeout=10000)
                time.sleep(0.5)  # Extra time for fonts to render
                
                screenshot_path = f"f:/chargo_order/汇报/pptx-workspace/slides/screenshot_{slide_name.replace('.html', '.png')}"
                page.screenshot(path=screenshot_path, full_page=False)
                
                print(f"[OK] Screenshot saved: {screenshot_path}")
                
                # Get some basic info
                body_size = page.evaluate("""() => {
                    const body = document.body;
                    return {
                        width: body.offsetWidth,
                        height: body.offsetHeight,
                        scrollWidth: body.scrollWidth,
                        scrollHeight: body.scrollHeight
                    };
                }""")
                
                print(f"  Body dimensions: {body_size['width']}x{body_size['height']}px")
                print(f"  Scroll dimensions: {body_size['scrollWidth']}x{body_size['scrollHeight']}px")
                
                # Check for overflow
                has_overflow = body_size['scrollWidth'] > 960 or body_size['scrollHeight'] > 540
                if has_overflow:
                    print(f"  [WARNING] Content overflow detected!")
                else:
                    print(f"  [OK] No overflow detected")
                    
            except Exception as e:
                print(f"[ERROR] {e}")
        
        browser.close()
        print(f"\n{'='*60}")
        print("All screenshots completed!")
        print('='*60)

if __name__ == "__main__":
    capture_screenshots()
