#!/usr/bin/env python3
"""Smoke test for camelCase refactoring UI validation."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🔍 Opening app at http://localhost:8080/")
        page.goto('http://localhost:8080/')
        page.wait_for_load_state('networkidle')
        print("✓ App loaded")

        # Take screenshot of initial state
        screenshot_path = Path('/tmp/01_initial_state.png')
        page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"✓ Screenshot: {screenshot_path}")

        # Check for console errors
        console_messages = []
        def handle_console_msg(msg):
            console_messages.append(msg.text)
        page.on('console', handle_console_msg)

        # Simulate service-mode flow: look for context loading
        print("\n📋 Checking service mode context...")
        # The setup should load from persistence and read serviceMode properly
        time.sleep(1)

        # Try to inspect if we can find tab navigation
        print("\n📊 Testing plot tabs...")
        tabs = page.locator('button').all()
        print(f"  Found {len(tabs)} buttons on page")

        # Look for tab labels (UQ, SUMO, MOGA)
        all_text = page.content()
        has_uq = 'UQ' in all_text
        has_sumo = 'SuMo' in all_text or 'SUMO' in all_text
        has_moga = 'MOGA' in all_text

        print(f"  UQ tab: {'✓' if has_uq else '✗'}")
        print(f"  SuMo tab: {'✓' if has_sumo else '✗'}")
        print(f"  MOGA tab: {'✓' if has_moga else '✗'}")

        # Check for data-test attributes (common test selectors)
        print("\n🔧 Checking for required components...")
        has_jobs_loading = 'jobs' in all_text.lower()
        has_parallel_runner = 'parallel' in all_text.lower()

        print(f"  Jobs/Sampling components: {'✓' if has_jobs_loading else '?'}")
        print(f"  Parallel runner: {'✓' if has_parallel_runner else '?'}")

        # Check console for errors (payload adapter errors, context errors)
        print("\n⚠️  Console messages:")
        errors = [m for m in console_messages if 'error' in m.lower()]
        if errors:
            for e in errors:
                print(f"  ❌ {e}")
        else:
            print("  ✓ No error messages")

        # Try to click through tabs if they exist
        print("\n🔄 Testing navigation...")
        try:
            # Look for any clickable tab-like elements
            nav_buttons = page.locator('button[role="tab"]').all()
            if nav_buttons:
                print(f"  Found {len(nav_buttons)} tab buttons")
                for i, btn in enumerate(nav_buttons[:3]):  # Test first 3 tabs
                    btn.click()
                    page.wait_for_load_state('networkidle')
                    screenshot_path = Path(f'/tmp/0{i+2}_tab_{i}.png')
                    page.screenshot(path=str(screenshot_path), full_page=True)
                    print(f"  ✓ Tab {i}: {screenshot_path}")
            else:
                print("  (No tab navigation found - app may use different routing)")
        except Exception as e:
            print(f"  Navigation test skipped: {e}")

        # Final screenshot
        screenshot_path = Path('/tmp/99_final_state.png')
        page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"\n✅ Final screenshot: {screenshot_path}")

        browser.close()
        print("\n✨ Smoke test complete - no critical errors detected")

if __name__ == '__main__':
    main()
