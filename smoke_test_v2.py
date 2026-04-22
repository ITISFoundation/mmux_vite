#!/usr/bin/env python3
"""Enhanced smoke test with better React waiting."""
import json
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        logs = []
        errors = []

        def on_console(msg):
            if 'error' in msg.type.lower():
                errors.append(msg.text)
            logs.append(f"[{msg.type}] {msg.text}")

        page.on('console', on_console)

        print("🔍 Loading app...")
        page.goto('http://localhost:8080/')

        # Wait for React root to have content
        print("⏳ Waiting for React to render...")
        page.wait_for_selector('#root > *', timeout=10000)
        print("✓ React app mounted")

        # Let it settle
        page.wait_for_load_state('networkidle')
        print("✓ Network idle")

        # Check root content
        root = page.locator('#root')
        classes = root.get_attribute('class') or ''
        print(f"\n📊 Root element classes: {classes if classes else '(none)'}")

        # Get all text content
        text = page.content()

        # Check for data attribute indicators
        print("\n🔍 Looking for app components...")

        # Common component indicators
        indicators = {
            'Setup': 'Setup' in text,
            'MetaModeling': 'MetaModeling' in text or 'MetaModelingUX' in text,
            'ReturnCurrentView': 'ReturnCurrentView' in text or 'currentView' in text,
            'Header': 'Header' in text,
            'ServiceContext': 'serviceMode' in text or 'Service' in text,
        }

        for component, found in indicators.items():
            print(f"  {component}: {'✓' if found else '✗'}")

        # Check for initialization functions
        print("\n🎯 Checking for app initialization...")
        has_app_init = 'React' in text or '__react' in text or 'createRoot' in text
        print(f"  React initialization: {'✓' if has_app_init else '?'}")

        # Check for key contexts
        contexts = {
            'MMUX': 'MMUXContext' in text,
            'Service': 'ServiceContext' in text,
            'Sampling': 'SamplingContext' in text,
            'Job': 'JobContext' in text,
            'Function': 'FunctionContext' in text,
        }

        print("\n📦 Available contexts:")
        for ctx, found in contexts.items():
            print(f"  {ctx}: {'✓' if found else '✗'}")

        # Check console for errors
        print("\n⚠️  Console analysis:")
        if errors:
            print(f"  Errors found: {len(errors)}")
            for e in errors[:3]:
                print(f"    - {e[:100]}")
        else:
            print("  No console errors ✓")

        # Log specific messages about initialization
        init_logs = [l for l in logs if any(x in l.lower() for x in ['loading', 'saving', 'context', 'service'])]
        if init_logs:
            print("\n  Initialization logs:")
            for log in init_logs[:5]:
                print(f"    {log[:80]}")

        # Screenshot
        page.screenshot(path='/tmp/app_full_render.png', full_page=True)
        print("\n✅ Screenshot saved: /tmp/app_full_render.png")

        # Check for visible UI elements
        print("\n🖱️  UI Elements:")
        buttons = page.locator('button').all()
        inputs = page.locator('input').all()
        selects = page.locator('select').all()

        print(f"  Buttons: {len(buttons)}")
        print(f"  Inputs: {len(inputs)}")
        print(f"  Selects: {len(selects)}")

        # List first few button labels
        if buttons:
            print("\n  Button labels:")
            for btn in buttons[:5]:
                text = btn.text_content() or ''
                if text.strip():
                    print(f"    - {text.strip()[:40]}")

        browser.close()
        print("\n✨ Smoke test complete")

if __name__ == '__main__':
    main()
