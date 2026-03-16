from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Navigate to localhost
    page.goto('http://localhost:3000/')
    
    # Wait for network to be idle
    page.wait_for_load_state('networkidle')
    
    # Wait additional 4 seconds as requested
    time.sleep(4)
    
    # Take full-page screenshot
    page.screenshot(path='dashboard_circuit_pattern.png', full_page=True)
    
    print("Screenshot saved as dashboard_circuit_pattern.png")
    
    browser.close()
