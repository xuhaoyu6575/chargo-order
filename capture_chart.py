from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Navigate to the page
    print("Navigating to http://localhost:3000/")
    page.goto('http://localhost:3000/')
    
    # Wait 3 seconds as requested
    print("Waiting 3 seconds for page to fully load...")
    time.sleep(3)
    
    # Also wait for network to be idle
    page.wait_for_load_state('networkidle')
    
    # Take full page screenshot
    print("Taking full page screenshot...")
    page.screenshot(path='f:/chargo_order/full_page.png', full_page=True)
    
    # Try to find the specific section "平均服务流程耗时（堆叠条形图）"
    print("\nSearching for the chart section...")
    
    # Get page content to analyze
    content = page.content()
    
    # Try to locate the chart section by text
    try:
        # Look for the heading or section containing the text
        chart_section = page.locator('text=平均服务流程耗时')
        if chart_section.count() > 0:
            print(f"Found {chart_section.count()} element(s) with '平均服务流程耗时' text")
            
            # Get the first matching element and its bounding box
            first_element = chart_section.first
            box = first_element.bounding_box()
            
            if box:
                print(f"Element position: x={box['x']}, y={box['y']}, width={box['width']}, height={box['height']}")
                
                # Try to find parent container (might be a card or section)
                parent = first_element.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "section") or contains(@class, "chart")]').first
                if parent.count() > 0:
                    parent_box = parent.bounding_box()
                    if parent_box:
                        # Capture the parent container with some padding
                        page.screenshot(
                            path='f:/chargo_order/chart_section.png',
                            clip={
                                'x': max(0, parent_box['x'] - 20),
                                'y': max(0, parent_box['y'] - 20),
                                'width': min(parent_box['width'] + 40, page.viewport_size['width']),
                                'height': min(parent_box['height'] + 40, page.viewport_size['height'])
                            }
                        )
                        print("Captured chart section screenshot")
                else:
                    # Capture just around the found element with generous padding
                    page.screenshot(
                        path='f:/chargo_order/chart_section.png',
                        clip={
                            'x': max(0, box['x'] - 50),
                            'y': max(0, box['y'] - 50),
                            'width': min(box['width'] + 500, page.viewport_size['width']),
                            'height': min(box['height'] + 400, page.viewport_size['height'])
                        }
                    )
                    print("Captured chart section screenshot (with padding)")
            else:
                print("Could not get bounding box for the element")
        else:
            print("Chart section not found by text")
            
    except Exception as e:
        print(f"Error finding chart section: {e}")
    
    # Get all text content to report what's on the page
    print("\n=== Page Text Content (first 2000 chars) ===")
    text_content = page.inner_text('body')
    print(text_content[:2000])
    
    # Get all visible elements with chart-related classes
    print("\n=== Looking for chart elements ===")
    chart_divs = page.locator('[class*="chart"], [class*="Chart"]').all()
    print(f"Found {len(chart_divs)} elements with 'chart' in class name")
    
    # Look for SVG elements (charts are often SVG)
    svgs = page.locator('svg').all()
    print(f"Found {len(svgs)} SVG elements on page")
    
    if len(svgs) > 0:
        print("\nCapturing area around SVG elements...")
        for i, svg in enumerate(svgs[:3]):  # Capture first 3 SVGs
            try:
                box = svg.bounding_box()
                if box and box['width'] > 100 and box['height'] > 100:
                    page.screenshot(
                        path=f'f:/chargo_order/svg_chart_{i+1}.png',
                        clip={
                            'x': max(0, box['x'] - 30),
                            'y': max(0, box['y'] - 30),
                            'width': min(box['width'] + 60, page.viewport_size['width']),
                            'height': min(box['height'] + 60, page.viewport_size['height'])
                        }
                    )
                    print(f"  Captured SVG #{i+1} at x={box['x']}, y={box['y']}")
            except Exception as e:
                print(f"  Error capturing SVG #{i+1}: {e}")
    
    browser.close()
    print("\n=== Screenshots saved ===")
    print("- full_page.png: Complete page screenshot")
    print("- chart_section.png: Chart section (if found)")
    print("- svg_chart_*.png: Individual SVG charts (if found)")
