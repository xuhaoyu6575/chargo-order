from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print("Navigating to http://localhost:3000/")
    page.goto('http://localhost:3000/')
    
    print("Waiting 5 seconds for page to load completely...")
    time.sleep(5)
    
    # Also wait for network to be idle
    page.wait_for_load_state('networkidle')
    
    print("Taking screenshot...")
    page.screenshot(path='localhost_screenshot.png', full_page=True)
    
    # Get the HTML content to analyze background styling
    html_content = page.content()
    
    # Try to get computed styles of body and main elements
    body_styles = page.evaluate("""() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return {
            background: computedStyle.background,
            backgroundColor: computedStyle.backgroundColor,
            backgroundImage: computedStyle.backgroundImage,
            backgroundSize: computedStyle.backgroundSize,
            backgroundRepeat: computedStyle.backgroundRepeat
        };
    }""")
    
    # Check for main container or dashboard elements
    main_element = page.evaluate("""() => {
        const main = document.querySelector('main') || document.querySelector('.dashboard') || document.querySelector('[class*="container"]');
        if (main) {
            const computedStyle = window.getComputedStyle(main);
            return {
                tagName: main.tagName,
                className: main.className,
                background: computedStyle.background,
                backgroundColor: computedStyle.backgroundColor,
                backgroundImage: computedStyle.backgroundImage,
                backgroundSize: computedStyle.backgroundSize,
                backgroundRepeat: computedStyle.backgroundRepeat
            };
        }
        return null;
    }""")
    
    print("\n=== Body Styles ===")
    print(f"Background: {body_styles['background']}")
    print(f"Background Color: {body_styles['backgroundColor']}")
    print(f"Background Image: {body_styles['backgroundImage']}")
    print(f"Background Size: {body_styles['backgroundSize']}")
    print(f"Background Repeat: {body_styles['backgroundRepeat']}")
    
    if main_element:
        print("\n=== Main Container Styles ===")
        print(f"Element: <{main_element['tagName']}> class=\"{main_element['className']}\"")
        print(f"Background: {main_element['background']}")
        print(f"Background Color: {main_element['backgroundColor']}")
        print(f"Background Image: {main_element['backgroundImage']}")
        print(f"Background Size: {main_element['backgroundSize']}")
        print(f"Background Repeat: {main_element['backgroundRepeat']}")
    
    print("\nScreenshot saved as: localhost_screenshot.png")
    
    browser.close()
