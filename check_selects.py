from playwright.sync_api import sync_playwright
import time

def check_select_dropdowns():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        print("Navigating to http://localhost:3000/")
        page.goto('http://localhost:3000/', timeout=10000)
        time.sleep(3)
        
        print("\n=== Checking Select Dropdowns ===")
        
        # Get all select elements
        selects = page.locator('select').all()
        print(f"Found {len(selects)} select dropdowns\n")
        
        for i, select in enumerate(selects):
            print(f"--- Dropdown {i+1} ---")
            
            # Get current value
            current_value = select.evaluate('el => el.value')
            print(f"Current value: {current_value}")
            
            # Get all options
            options = select.locator('option').all()
            print(f"Number of options: {len(options)}")
            
            for j, option in enumerate(options):
                try:
                    text = option.text_content()
                    value = option.evaluate('el => el.value')
                    is_selected = option.evaluate('el => el.selected')
                    print(f"  Option {j+1}: text='{text}', value='{value}', selected={is_selected}")
                except Exception as e:
                    print(f"  Option {j+1}: Error reading - {e}")
            
            print()
            
            # Take screenshot of the dropdown area
            try:
                bbox = select.bounding_box()
                if bbox:
                    print(f"Position: x={bbox['x']}, y={bbox['y']}, width={bbox['width']}, height={bbox['height']}")
            except:
                pass
        
        # Try clicking on the first select to open it
        if len(selects) > 0:
            print("\n=== Testing Dropdown Interaction ===")
            try:
                first_select = selects[0]
                first_select.click()
                time.sleep(1)
                page.screenshot(path='dropdown_clicked.png')
                print("[OK] Screenshot after clicking first dropdown saved")
                time.sleep(1)
            except Exception as e:
                print(f"[ERROR] Could not interact with dropdown: {e}")
        
        # Full page screenshot
        page.screenshot(path='full_page_selects.png')
        print("[OK] Full page screenshot saved")
        
        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    check_select_dropdowns()
