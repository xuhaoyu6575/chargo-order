from playwright.sync_api import sync_playwright
import time
import sys
import os

# Set UTF-8 encoding for Windows console
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

def test_dashboard():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        print("Navigating to http://localhost:3000/")
        try:
            # Navigate to the dashboard
            page.goto('http://localhost:3000/', timeout=10000)
            
            # Wait for page to load (at least 3 seconds as requested)
            print("Waiting for page to fully load...")
            time.sleep(3)
            
            # Take initial screenshot
            page.screenshot(path='dashboard_full.png', full_page=True)
            print("[OK] Screenshot saved as 'dashboard_full.png'")
            
            # Check 1: Page renders without errors
            print("\n=== Check 1: Page Rendering ===")
            page_title = page.title()
            print(f"Page Title: {page_title}")
            
            # Check for console errors
            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            
            # Check 2: Site selector dropdown
            print("\n=== Check 2: Site Selector Dropdown ===")
            try:
                # Look for site selector button/dropdown
                site_selector = page.locator('[class*="site"]').first
                if site_selector.is_visible():
                    print("[OK] Site selector is visible")
                    
                    # Try to click it to see options
                    site_selector.click(timeout=2000)
                    time.sleep(1)
                    
                    # Check if dropdown options appear
                    options = page.locator('[role="option"], [class*="option"], option').all()
                    if len(options) > 0:
                        print(f"[OK] Site selector dropdown shows {len(options)} options")
                        for i, opt in enumerate(options[:5]):  # Show first 5 options
                            try:
                                print(f"  - Option {i+1}: {opt.text_content()}")
                            except:
                                pass
                    else:
                        print("[WARNING] No dropdown options found")
                    
                    # Close dropdown
                    page.keyboard.press('Escape')
                else:
                    print("[WARNING] Site selector not found or not visible")
            except Exception as e:
                print(f"[WARNING] Error checking site selector: {str(e)}")
            
            # Check 3: Chart cards visibility
            print("\n=== Check 3: Chart Cards ===")
            try:
                chart_cards = page.locator('[class*="chart"], [class*="Chart"], canvas, svg[class*="recharts"]').all()
                print(f"[OK] Found {len(chart_cards)} chart elements")
                
                # Try to identify specific chart types
                canvas_charts = page.locator('canvas').all()
                svg_charts = page.locator('svg[class*="recharts"]').all()
                print(f"  - Canvas charts: {len(canvas_charts)}")
                print(f"  - SVG charts (Recharts): {len(svg_charts)}")
            except Exception as e:
                print(f"[WARNING] Error checking charts: {str(e)}")
            
            # Check 4: Stats cards with data
            print("\n=== Check 4: Stats Cards (totalOrders, totalKwh, activeRobots) ===")
            try:
                # Look for stat cards or metric displays
                stat_cards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]').all()
                print(f"Found {len(stat_cards)} potential stat elements")
                
                # Try to find specific stats
                stats_to_check = ['totalOrders', 'totalKwh', 'activeRobots', 'orders', 'kwh', 'robots']
                for stat_name in stats_to_check:
                    try:
                        # Case-insensitive search
                        stat_element = page.locator(f'text=/{stat_name}/i').first
                        if stat_element.is_visible(timeout=1000):
                            parent = stat_element.locator('xpath=ancestor::*[1]')
                            text = parent.text_content()
                            print(f"[OK] Found '{stat_name}': {text}")
                    except:
                        pass
                
                # Try to find any numbers displayed prominently
                print("\nLooking for stat numbers...")
                numbers = page.locator('[class*="stat"] >> text=/\\d+/').all()
                if len(numbers) > 0:
                    print(f"[OK] Found {len(numbers)} stat numbers displayed")
                else:
                    # Alternative: look for any large numbers on the page
                    all_text = page.locator('body').text_content()
                    import re
                    large_numbers = re.findall(r'\b\d{2,}\b', all_text)
                    if large_numbers:
                        print(f"[OK] Found numbers on page: {', '.join(large_numbers[:10])}")
                    else:
                        print("[WARNING] No stat numbers found")
                        
            except Exception as e:
                print(f"[WARNING] Error checking stats: {str(e)}")
            
            # Take a final screenshot
            time.sleep(1)
            page.screenshot(path='dashboard_final.png', full_page=True)
            print("\n[OK] Final screenshot saved as 'dashboard_final.png'")
            
            # Print page content summary
            print("\n=== Page Content Summary ===")
            body_text = page.locator('body').text_content()
            print(f"Page has {len(body_text)} characters of text content")
            
            # Check for common error messages
            if 'error' in body_text.lower() or 'failed' in body_text.lower():
                print("[WARNING] Warning: Error-related text found on page")
            else:
                print("[OK] No obvious error messages on page")
            
            print("\n=== Test Complete ===")
            
        except Exception as e:
            print(f"\n[ERROR] Error during test: {str(e)}")
            page.screenshot(path='dashboard_error.png')
            print("Error screenshot saved as 'dashboard_error.png'")
            
        finally:
            # Keep browser open for a moment to see the result
            time.sleep(2)
            browser.close()

if __name__ == '__main__':
    test_dashboard()
