#!/usr/bin/env python3
"""
Autonomous webapp testing with Playwright.
Captures console logs, errors, warnings, and interactions.
"""

import json
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


def run_app_automation():
    """Run automated testing and log all console messages."""

    console_messages = {"log": [], "error": [], "warning": [], "debug": [], "info": []}
    screenshots = []

    def on_console_message(msg):
        """Capture all console messages."""
        msg_dict = {
            "type": msg.type,
            "text": msg.text,
            "location": msg.location,
        }
        bucket = console_messages.get(msg.type)
        if bucket is None:
            console_messages.setdefault("other", []).append(msg_dict)
        else:
            bucket.append(msg_dict)
        print(f"[{msg.type.upper()}] {msg.text}")
        if msg.location:
            print(f"  Location: {msg.location}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set up console message handler
        page.on("console", on_console_message)

        try:
            print("=" * 80)
            print("WEBAPP AUTOMATION TEST")
            print("=" * 80)

            # Navigate to the app
            print("\n[1] Navigating to http://localhost:8888...")
            page.goto("http://localhost:8888", timeout=30000)
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Screenshot after load
            screenshot_path = "/tmp/app_initial.png"
            page.screenshot(path=screenshot_path, full_page=True)
            screenshots.append({"step": "initial_load", "path": screenshot_path})
            print(f"✓ Screenshot saved: {screenshot_path}")

            # [2] Test function selection flow
            print("\n[2] Testing function selection...")
            page.wait_for_selector("button:has-text('Setup')", timeout=10000)
            setup_buttons = page.locator("button:has-text('Setup')").all()
            if setup_buttons:
                print(f"✓ Found {len(setup_buttons)} Setup buttons")
                # Look for function list
                page.wait_for_selector("text=Functions", timeout=5000)
                print("✓ Functions list visible")
            else:
                print("⚠ No Setup buttons found")

            # Wait and check for function rendering
            time.sleep(3)
            page.wait_for_timeout(2000)

            screenshot_path = "/tmp/app_functions_loaded.png"
            page.screenshot(path=screenshot_path, full_page=True)
            screenshots.append({"step": "functions_loaded", "path": screenshot_path})
            print(f"✓ Screenshot saved: {screenshot_path}")

            # [3] Look for data grid rows (functions)
            print("\n[3] Checking for function data...")
            try:
                rows = page.locator('div[role="row"]').all()
                print(f"✓ Found {len(rows)} data rows")

                # Try to select first function
                select_buttons = page.locator("button:has-text('Select')").all()
                if select_buttons:
                    print(f"✓ Found {len(select_buttons)} Select buttons - clicking first one...")
                    select_buttons[0].click()
                    page.wait_for_timeout(2000)

                    screenshot_path = "/tmp/app_function_selected.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    screenshots.append(
                        {"step": "function_selected", "path": screenshot_path}
                    )
                    print(f"✓ Screenshot saved: {screenshot_path}")
                else:
                    print("⚠ No Select buttons found")
            except Exception as e:
                print(f"⚠ Error during function selection: {e}")

            # [4] Test tab navigation
            print("\n[4] Testing tab navigation...")
            try:
                uq_tab = page.locator('button:has-text("UQ")').first
                if uq_tab:
                    print("✓ Found UQ tab - clicking...")
                    uq_tab.click()
                    page.wait_for_timeout(2000)

                    screenshot_path = "/tmp/app_uq_tab.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    screenshots.append({"step": "uq_tab", "path": screenshot_path})
                    print(f"✓ Screenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"⚠ Error during tab navigation: {e}")

            # [5] Test SUMO tab
            print("\n[5] Testing SUMO tab...")
            try:
                sumo_tab = page.locator('button:has-text("SUMO")').first
                if sumo_tab:
                    print("✓ Found SUMO tab - clicking...")
                    sumo_tab.click()
                    page.wait_for_timeout(2000)

                    screenshot_path = "/tmp/app_sumo_tab.png"
                    page.screenshot(path=screenshot_path, full_page=True)
                    screenshots.append({"step": "sumo_tab", "path": screenshot_path})
                    print(f"✓ Screenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"⚠ Error during SUMO tab: {e}")

            # [6] Check for form inputs and state
            print("\n[6] Checking form inputs...")
            inputs = page.locator("input").all()
            print(f"✓ Found {len(inputs)} input elements")

            # [7] Final screenshot
            time.sleep(2)
            screenshot_path = "/tmp/app_final.png"
            page.screenshot(path=screenshot_path, full_page=True)
            screenshots.append({"step": "final", "path": screenshot_path})
            print(f"✓ Screenshot saved: {screenshot_path}")

        except Exception as e:
            print(f"❌ Error during automation: {e}")
        finally:
            browser.close()

    # Print summary
    print("\n" + "=" * 80)
    print("CONSOLE MESSAGES SUMMARY")
    print("=" * 80)

    for msg_type in ["error", "warning", "log", "info", "debug", "other"]:
        messages = console_messages.get(msg_type, [])
        if messages:
            print(f"\n{msg_type.upper()} ({len(messages)}):")
            for i, msg in enumerate(messages, 1):
                print(f"  {i}. {msg['text']}")
                if msg.get("location"):
                    print(f"     Location: {msg['location']}")

    # Save detailed report
    report = {
        "console_messages": console_messages,
        "screenshots": screenshots,
        "summary": {
            "total_errors": len(console_messages.get("error", [])),
            "total_warnings": len(console_messages.get("warning", [])),
            "total_logs": len(console_messages.get("log", [])),
        },
    }

    report_path = "/tmp/app_test_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Full report saved to: {report_path}")

    return report


if __name__ == "__main__":
    print("Starting webapp automation test...")
    print("Make sure the app is running on http://localhost:8888")
    print("Starting in 5 seconds...\n")
    time.sleep(5)

    report = run_app_automation()

    # Exit with error code if errors found
    if report["summary"]["total_errors"] > 0:
        print(f"\n❌ Test completed with {report['summary']['total_errors']} errors")
        exit(1)
    else:
        print(f"\n✓ Test completed successfully")
        exit(0)
