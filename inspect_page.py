from playwright.sync_api import sync_playwright
import time

def inspect_page_structure():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        print("Navigating to http://localhost:3000/")
        page.goto('http://localhost:3000/', timeout=10000)
        time.sleep(3)
        
        # Get the full page HTML
        html_content = page.content()
        
        # Save to file for inspection
        with open('page_structure.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("[OK] Page HTML saved to 'page_structure.html'")
        
        # Look for all clickable elements with text
        print("\n=== All Clickable Elements ===")
        clickable = page.locator('button, a, [onclick], [role="button"]').all()
        print(f"Found {len(clickable)} clickable elements")
        
        for i, elem in enumerate(clickable[:20]):  # First 20
            try:
                text = elem.text_content().strip()
                if text:
                    tag = elem.evaluate('el => el.tagName')
                    classes = elem.evaluate('el => el.className')
                    print(f"{i+1}. <{tag}> class='{classes}': '{text}'")
            except:
                pass
        
        # Check for dropdowns/selects
        print("\n=== Dropdown/Select Elements ===")
        selects = page.locator('select, [class*="Select"], [class*="select"]').all()
        print(f"Found {len(selects)} select/dropdown elements")
        
        for i, sel in enumerate(selects):
            try:
                classes = sel.evaluate('el => el.className')
                id_attr = sel.evaluate('el => el.id')
                print(f"{i+1}. class='{classes}', id='{id_attr}'")
            except:
                pass
        
        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    inspect_page_structure()
