from playwright.sync_api import sync_playwright
import time

def verify_dashboard_design():
    print("Starting browser verification with Playwright...")
    
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1920, 'height': 1080})
            page = context.new_page()
            
            print("Navigating to http://localhost:3000/...")
            page.goto('http://localhost:3000/')
            
            print("Waiting 5 seconds for page to fully load...")
            time.sleep(5)
            
            # Get full page height
            total_height = page.evaluate("() => document.body.scrollHeight")
            print(f"Page height: {total_height}px")
            
            # Set viewport to full page size
            page.set_viewport_size({'width': 1920, 'height': total_height})
            time.sleep(1)
            
            # Take full-page screenshot
            screenshot_path = 'dashboard_fullpage_verification.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"[OK] Screenshot saved to: {screenshot_path}")
            
            # Analyze background
            print("\n" + "="*60)
            print("BACKGROUND ANALYSIS")
            print("="*60)
            
            body_bg = page.evaluate("""() => {
                const body = document.body;
                const computed = window.getComputedStyle(body);
                return {
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    backgroundSize: computed.backgroundSize,
                    backgroundRepeat: computed.backgroundRepeat,
                    backgroundPosition: computed.backgroundPosition
                };
            }""")
            
            print(f"Body background color: {body_bg['backgroundColor']}")
            print(f"Body background image: {body_bg['backgroundImage'][:200]}...")
            print(f"Body background size: {body_bg['backgroundSize']}")
            print(f"Body background repeat: {body_bg['backgroundRepeat']}")
            
            # Check for circuit board pattern
            print("\n" + "="*60)
            print("CIRCUIT BOARD PATTERN CHECK")
            print("="*60)
            
            circuit_check = page.evaluate("""() => {
                const body = document.body;
                const bgImage = window.getComputedStyle(body).backgroundImage;
                
                const hasSvgPattern = bgImage.includes('svg') || bgImage.includes('data:image/svg');
                const hasLinearGradient = bgImage.includes('linear-gradient');
                const hasCyanColor = bgImage.toLowerCase().includes('cyan') || 
                                    bgImage.includes('#0ff') || 
                                    bgImage.includes('#00f') ||
                                    bgImage.includes('aqua') ||
                                    bgImage.includes('rgb(0, 255, 255)');
                
                // Check for pseudo-elements that might contain the pattern
                const beforeContent = window.getComputedStyle(body, '::before').backgroundImage;
                const afterContent = window.getComputedStyle(body, '::after').backgroundImage;
                
                return {
                    hasSvgPattern: hasSvgPattern,
                    hasLinearGradient: hasLinearGradient,
                    hasCyanColor: hasCyanColor,
                    hasPseudoElements: beforeContent !== 'none' || afterContent !== 'none',
                    beforeBg: beforeContent,
                    afterBg: afterContent
                };
            }""")
            
            print(f"[OK] Has SVG pattern: {circuit_check['hasSvgPattern']}")
            print(f"[OK] Has linear gradient: {circuit_check['hasLinearGradient']}")
            print(f"[OK] Has cyan color: {circuit_check['hasCyanColor']}")
            print(f"[OK] Has pseudo-elements: {circuit_check['hasPseudoElements']}")
            
            # Analyze cards
            print("\n" + "="*60)
            print("CARD ELEVATION & FLOATING EFFECT ANALYSIS")
            print("="*60)
            
            cards_info = page.evaluate("""() => {
                const cards = document.querySelectorAll('.ant-card, .card, [class*="card"], .ant-statistic-card');
                const results = [];
                
                cards.forEach((card, index) => {
                    const computed = window.getComputedStyle(card);
                    const rect = card.getBoundingClientRect();
                    results.push({
                        index: index,
                        backgroundColor: computed.backgroundColor,
                        boxShadow: computed.boxShadow,
                        opacity: computed.opacity,
                        backdropFilter: computed.backdropFilter || computed.webkitBackdopFilter,
                        position: computed.position,
                        zIndex: computed.zIndex,
                        border: computed.border,
                        borderRadius: computed.borderRadius,
                        width: rect.width,
                        height: rect.height
                    });
                });
                
                return {
                    cardCount: cards.length,
                    cards: results
                };
            }""")
            
            print(f"Found {cards_info['cardCount']} cards on the page")
            
            if cards_info['cardCount'] > 0:
                print("\nAnalyzing first 3 cards:")
                for i, card in enumerate(cards_info['cards'][:3]):
                    print(f"\n  Card #{card['index']} ({card['width']}x{card['height']}px):")
                    print(f"    Background: {card['backgroundColor']}")
                    print(f"    Box Shadow: {card['boxShadow'][:100]}...")
                    print(f"    Opacity: {card['opacity']}")
                    print(f"    Backdrop Filter: {card['backdropFilter']}")
                    print(f"    Z-Index: {card['zIndex']}")
                    print(f"    Border Radius: {card['borderRadius']}")
            
            # Check container styles
            print("\n" + "="*60)
            print("LAYOUT STRUCTURE")
            print("="*60)
            
            layout_info = page.evaluate("""() => {
                const selectors = [
                    'main', '.main', '.content', '.dashboard', 
                    '.container', '.wrapper', '[class*="container"]',
                    '.ant-layout', '.ant-layout-content'
                ];
                
                const results = {};
                selectors.forEach(selector => {
                    const elem = document.querySelector(selector);
                    if (elem) {
                        const computed = window.getComputedStyle(elem);
                        results[selector] = {
                            backgroundColor: computed.backgroundColor,
                            backgroundImage: computed.backgroundImage.substring(0, 100),
                            position: computed.position,
                            display: computed.display
                        };
                    }
                });
                
                return results;
            }""")
            
            for selector, styles in layout_info.items():
                print(f"\n{selector}:")
                print(f"  Background Color: {styles['backgroundColor']}")
                print(f"  Background Image: {styles['backgroundImage']}")
            
            # Final verification summary
            print("\n" + "="*60)
            print("VERIFICATION SUMMARY")
            print("="*60)
            
            print("\n1. Circuit Board Pattern:")
            if circuit_check['hasSvgPattern']:
                print("   [OK] SVG pattern detected in background")
            elif circuit_check['hasLinearGradient']:
                print("   [WARN] Linear gradient detected (pattern may be CSS-based)")
            else:
                print("   [X] No obvious pattern detected in CSS")
                
            if circuit_check['hasCyanColor']:
                print("   [OK] Cyan color detected in background")
            else:
                print("   [X] Cyan color not detected")
            
            print("\n2. Card Elevation Effect:")
            if cards_info['cardCount'] > 0:
                has_shadows = any('rgba' in card.get('boxShadow', '') or 'rgb' in card.get('boxShadow', '') 
                                for card in cards_info['cards'])
                has_transparency = any('rgba' in card.get('backgroundColor', '') 
                                     for card in cards_info['cards'])
                has_backdrop = any(card.get('backdropFilter') not in [None, 'none', ''] 
                                 for card in cards_info['cards'])
                
                if has_shadows:
                    print("   [OK] Cards have box shadows (elevation effect)")
                else:
                    print("   [X] Cards missing box shadows")
                    
                if has_transparency:
                    print("   [OK] Cards have semi-transparent backgrounds")
                else:
                    print("   [WARN] Cards may have solid backgrounds")
                    
                if has_backdrop:
                    print("   [OK] Cards using backdrop filter (glass effect)")
                else:
                    print("   [WARN] No backdrop filter detected")
            
            print("\n" + "="*60)
            print("VISUAL INSPECTION REQUIRED")
            print("="*60)
            print(f"\n[OK] Full-page screenshot saved: {screenshot_path}")
            print("\nPlease verify the following in the screenshot:")
            print("  1. Circuit board pattern with thin cyan lines at right angles")
            print("  2. Dashboard cards floating above the background")
            print("  3. Cards have darker, semi-transparent backgrounds")
            print("  4. Circuit lines visible in gaps between cards")
            print("  5. Overall 'tech dashboard floating over PCB' aesthetic")
            
            browser.close()
            
        except Exception as e:
            print(f"\n[ERROR] Error during verification: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    verify_dashboard_design()
