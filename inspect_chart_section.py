from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Non-headless to see what's happening
    page = browser.new_page()
    
    # Navigate to the page
    print("Navigating to http://localhost:3000/")
    page.goto('http://localhost:3000/')
    
    # Wait 4 seconds for page to fully load as requested
    print("Waiting 4 seconds for page to fully load...")
    time.sleep(4)
    
    # Take initial screenshot
    page.screenshot(path='f:/chargo_order/screenshot_initial.png', full_page=True)
    print("Initial full page screenshot saved")
    
    # Try to find the section with "平均服务流程耗时"
    print("Looking for section '平均服务流程耗时（堆叠条形图）'...")
    
    # Try to locate the section by text
    try:
        # Look for the heading
        section = page.locator('text=平均服务流程耗时').first
        section.scroll_into_view_if_needed()
        print("Scrolled to section")
        
        # Wait a moment after scrolling
        time.sleep(1)
        
        # Take screenshot of the specific section
        page.screenshot(path='f:/chargo_order/screenshot_section.png', full_page=True)
        print("Section screenshot saved")
        
        # Get the HTML content of the section for inspection
        # Try to find the parent container
        parent = page.locator('text=平均服务流程耗时').locator('..').locator('..').first
        html_content = parent.inner_html()
        
        with open('f:/chargo_order/section_html.txt', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("Section HTML saved")
        
    except Exception as e:
        print(f"Error finding section: {e}")
        # Take a screenshot anyway
        page.screenshot(path='f:/chargo_order/screenshot_error.png', full_page=True)
    
    # Keep browser open for a moment to see the result
    time.sleep(2)
    
    browser.close()
    print("Done!")
