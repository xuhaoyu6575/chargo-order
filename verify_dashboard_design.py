from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import time
import os

def verify_dashboard_design():
    print("Starting browser verification...")
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--force-device-scale-factor=1')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        
        print("Navigating to http://localhost:3000/...")
        driver.get('http://localhost:3000/')
        
        print("Waiting 5 seconds for page to fully load...")
        time.sleep(5)
        
        # Get page height for full-page screenshot
        total_height = driver.execute_script("return document.body.scrollHeight")
        viewport_height = driver.execute_script("return window.innerHeight")
        print(f"Page height: {total_height}px, Viewport: {viewport_height}px")
        
        # Set window size to capture full page
        driver.set_window_size(1920, total_height)
        time.sleep(1)
        
        # Take full-page screenshot
        screenshot_path = 'dashboard_fullpage_verification.png'
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved to: {screenshot_path}")
        
        # Get computed styles and analyze background
        print("\n=== BACKGROUND ANALYSIS ===")
        body_bg = driver.execute_script("""
            const body = document.body;
            const computed = window.getComputedStyle(body);
            return {
                backgroundColor: computed.backgroundColor,
                backgroundImage: computed.backgroundImage,
                backgroundSize: computed.backgroundSize,
                backgroundRepeat: computed.backgroundRepeat,
                backgroundPosition: computed.backgroundPosition
            };
        """)
        
        print(f"Body background color: {body_bg['backgroundColor']}")
        print(f"Body background image: {body_bg['backgroundImage']}")
        print(f"Body background size: {body_bg['backgroundSize']}")
        print(f"Body background repeat: {body_bg['backgroundRepeat']}")
        
        # Check for circuit board pattern elements
        print("\n=== CIRCUIT BOARD PATTERN CHECK ===")
        circuit_check = driver.execute_script("""
            const body = document.body;
            const bgImage = window.getComputedStyle(body).backgroundImage;
            
            // Check for SVG or linear gradient
            const hasSvgPattern = bgImage.includes('svg') || bgImage.includes('data:image/svg');
            const hasLinearGradient = bgImage.includes('linear-gradient');
            const hasCyanColor = bgImage.toLowerCase().includes('cyan') || bgImage.includes('#00') || bgImage.includes('rgb(0');
            
            return {
                hasSvgPattern: hasSvgPattern,
                hasLinearGradient: hasLinearGradient,
                hasCyanColor: hasCyanColor,
                fullBackgroundImage: bgImage
            };
        """)
        
        print(f"Has SVG pattern: {circuit_check['hasSvgPattern']}")
        print(f"Has linear gradient: {circuit_check['hasLinearGradient']}")
        print(f"Has cyan color: {circuit_check['hasCyanColor']}")
        
        # Check card styles and elevation
        print("\n=== CARD ELEVATION ANALYSIS ===")
        cards_info = driver.execute_script("""
            const cards = document.querySelectorAll('.ant-card, .card, [class*="card"]');
            const results = [];
            
            cards.forEach((card, index) => {
                const computed = window.getComputedStyle(card);
                results.push({
                    index: index,
                    backgroundColor: computed.backgroundColor,
                    boxShadow: computed.boxShadow,
                    opacity: computed.opacity,
                    backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
                    position: computed.position,
                    zIndex: computed.zIndex,
                    border: computed.border,
                    borderRadius: computed.borderRadius
                });
            });
            
            return {
                cardCount: cards.length,
                cards: results.slice(0, 5)  // First 5 cards
            };
        """)
        
        print(f"Found {cards_info['cardCount']} cards")
        for i, card in enumerate(cards_info['cards'][:3]):
            print(f"\nCard {card['index']}:")
            print(f"  Background: {card['backgroundColor']}")
            print(f"  Box Shadow: {card['boxShadow']}")
            print(f"  Opacity: {card['opacity']}")
            print(f"  Backdrop Filter: {card['backdropFilter']}")
            print(f"  Z-Index: {card['zIndex']}")
            print(f"  Border: {card['border']}")
        
        # Check for container/wrapper elements
        print("\n=== LAYOUT STRUCTURE ===")
        layout_info = driver.execute_script("""
            const main = document.querySelector('main, .main, .content, .dashboard');
            const container = document.querySelector('.container, .wrapper, [class*="container"]');
            
            const getStyles = (elem) => {
                if (!elem) return null;
                const computed = window.getComputedStyle(elem);
                return {
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    position: computed.position,
                    display: computed.display
                };
            };
            
            return {
                main: getStyles(main),
                container: getStyles(container)
            };
        """)
        
        if layout_info['main']:
            print("Main container styles:")
            print(f"  Background: {layout_info['main']['backgroundColor']}")
            print(f"  Background Image: {layout_info['main']['backgroundImage']}")
        
        print("\n=== VERIFICATION SUMMARY ===")
        print("1. Circuit board pattern check:")
        if circuit_check['hasSvgPattern']:
            print("   ✓ SVG pattern detected in background")
        else:
            print("   ✗ No SVG pattern detected")
            
        print("\n2. Card elevation check:")
        has_shadows = any(card.get('boxShadow') != 'none' for card in cards_info['cards'])
        has_transparency = any('rgba' in card.get('backgroundColor', '') for card in cards_info['cards'])
        if has_shadows:
            print("   ✓ Cards have box shadows")
        else:
            print("   ✗ Cards missing box shadows")
        if has_transparency:
            print("   ✓ Cards have semi-transparent backgrounds")
        else:
            print("   ✗ Cards missing transparency")
            
        print("\n=== VISUAL INSPECTION REQUIRED ===")
        print(f"Please check the screenshot: {screenshot_path}")
        print("Verify:")
        print("- Circuit board pattern with thin cyan lines at right angles")
        print("- Cards floating above the background")
        print("- Circuit lines visible in gaps between cards")
        print("- Overall 'tech dashboard floating over PCB' aesthetic")
        
    except Exception as e:
        print(f"Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()
            print("\nBrowser closed.")

if __name__ == "__main__":
    verify_dashboard_design()
