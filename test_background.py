from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Navigate to the page
    page.goto('http://localhost:3000/')
    
    # Perform hard refresh with cache busting (Ctrl+Shift+R equivalent)
    page.reload(wait_until='networkidle')
    
    # Wait 5 seconds for page to fully load
    print("Waiting 5 seconds for page to fully load...")
    time.sleep(5)
    
    # Take a screenshot
    screenshot_path = 'f:\\chargo_order\\localhost_screenshot.png'
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"Screenshot saved to: {screenshot_path}")
    
    # Get the page HTML to inspect background styling
    html_content = page.content()
    
    # Get computed styles of body and main elements
    body_bg = page.evaluate("""() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
            background: styles.background,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
            backgroundSize: styles.backgroundSize,
            backgroundRepeat: styles.backgroundRepeat
        };
    }""")
    
    print("\nBody background styles:")
    for key, value in body_bg.items():
        print(f"  {key}: {value}")
    
    # Check for any SVG patterns in the page
    svg_patterns = page.evaluate("""() => {
        const svgs = document.querySelectorAll('svg');
        return Array.from(svgs).map(svg => ({
            id: svg.id,
            className: svg.className.baseVal || svg.className,
            innerHTML: svg.innerHTML.substring(0, 200)
        }));
    }""")
    
    print(f"\nFound {len(svg_patterns)} SVG elements")
    for i, svg in enumerate(svg_patterns):
        print(f"\nSVG {i+1}:")
        print(f"  ID: {svg['id']}")
        print(f"  Class: {svg['className']}")
        print(f"  Content preview: {svg['innerHTML'][:100]}...")
    
    # Check for circuit board pattern div
    circuit_div = page.evaluate("""() => {
        const div = document.querySelector('.circuit-board-pattern');
        if (div) {
            const styles = window.getComputedStyle(div);
            return {
                exists: true,
                position: styles.position,
                zIndex: styles.zIndex,
                opacity: styles.opacity,
                top: styles.top,
                left: styles.left,
                width: styles.width,
                height: styles.height
            };
        }
        return { exists: false };
    }""")
    
    print("\nCircuit board pattern div:")
    print(circuit_div)
    
    # Keep browser open for a moment to see the page
    time.sleep(2)
    
    browser.close()
