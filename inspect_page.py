#!/usr/bin/env python3
"""Detailed page inspection."""
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto('http://localhost:8080/')
        page.wait_for_load_state('networkidle')

        # Get page title
        title = page.title()
        print(f"Page title: {title}")

        # Get main content structure
        body = page.locator('body')

        # Find all visible text
        all_text = page.content()

        # Check for key component indicators
        print("\n🔍 Page Analysis:")
        print(f"  Page length: {len(all_text)} chars")

        # Look for common framework elements
        has_vue = 'data-v-' in all_text or 'Vue' in all_text
        has_react = '__react' in all_text or 'data-react' in all_text

        print(f"  Vue detected: {has_vue}")
        print(f"  React detected: {has_react}")

        # Look for the actual app content
        if '#app' in all_text or 'id="app"' in all_text:
            print("  ✓ App root found")

        # Print visible text (first 1000 chars)
        print("\n📄 Rendered content (first 500 chars):")
        # Extract text nodes
        visible_text = page.locator('*').filter(has_text='.*').first.text_content() or ''
        print(visible_text[:500])

        # Check for specific view names
        print("\n🎯 Looking for known views...")
        keywords = ['Setup', 'Sampling', 'UQ', 'SUMO', 'MOGA', 'Results', 'MetaModeling',
                    'ReturnCurrentView', 'serviceMode', 'jobCollection', 'function']
        found = []
        for kw in keywords:
            if kw in all_text or kw.lower() in all_text.lower():
                found.append(kw)

        if found:
            print(f"  Found: {', '.join(found)}")
        else:
            print("  (none found in content)")

        browser.close()

if __name__ == '__main__':
    main()
