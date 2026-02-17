from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173/")

        # Wait for canvas
        page.wait_for_selector("canvas#screen")

        # Take screenshot of Home
        time.sleep(2) # Wait for assets
        page.screenshot(path="verification/home.png")
        print("Home screenshot taken")

        # Navigate to Settings (Setup)
        # Menu: Care(0), Gifts(1), Album(2), Settings(3), Games(4)
        # Initial state: Care(0) is selected?
        # Let's check UiState initial.
        # In Scenes.ts: menuIndex: 0. 0 is Care.
        # So we need RIGHT -> Gifts, RIGHT -> Album, RIGHT -> Settings.
        # 3 RIGHTS.

        for _ in range(3):
            page.keyboard.press("ArrowRight")
            time.sleep(0.5)

        page.keyboard.press("Enter")
        time.sleep(1)

        # Take screenshot of Settings
        page.screenshot(path="verification/settings.png")
        print("Settings screenshot taken")

        browser.close()

if __name__ == "__main__":
    run()
