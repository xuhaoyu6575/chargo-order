from playwright.sync_api import sync_playwright
import time

def check_site_selector():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        print("Navigating to http://localhost:3000/")
        page.goto('http://localhost:3000/', timeout=10000)
        time.sleep(3)
        
        print("\n=== Checking Site Selector in Detail ===")
        
        # Get all interactive elements in the header
        header_buttons = page.locator('header button, header select, [class*="select"], [class*="dropdown"]').all()
        print(f"Found {len(header_buttons)} interactive elements in header")
        
        for i, btn in enumerate(header_buttons):
            try:
                text = btn.text_content()
                is_visible = btn.is_visible()
                print(f"Element {i}: '{text}' - Visible: {is_visible}")
            except:
                pass
        
        # Look for the specific site selector (全站站点)
        try:
            site_btn = page.locator('button:has-text("全站站点")').first
            if site_btn.is_visible():
                print("\n[OK] Found site selector button: '全站站点'")
                print("Clicking site selector...")
                site_btn.click()
                time.sleep(1.5)
                
                # Take screenshot with dropdown open
                page.screenshot(path='site_selector_open.png')
                print("[OK] Screenshot with dropdown saved as 'site_selector_open.png'")
                
                # Check for dropdown options
                dropdown_items = page.locator('[role="menuitem"], [class*="menu-item"], [class*="dropdown-item"]').all()
                print(f"\n[OK] Found {len(dropdown_items)} dropdown items")
                
                for i, item in enumerate(dropdown_items):
                    try:
                        text = item.text_content()
                        print(f"  Site option {i+1}: {text}")
                    except:
                        pass
                
                time.sleep(1)
            else:
                print("[WARNING] Site selector button not visible")
        except Exception as e:
            print(f"[ERROR] Error with site selector: {e}")
        
        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    check_site_selector()
