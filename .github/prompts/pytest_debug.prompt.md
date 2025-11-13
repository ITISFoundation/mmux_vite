Here is an expert-level prompt for Python test debugging using pytest, following the structure and quality guidelines from your `refine_prompt.prompt.md`:

---

# Python Test Debugging with Pytest

## Objective
Efficiently debug Python tests using pytest, always ensuring the correct Python environment is used.

## Stepwise Instructions

1. **Test Discovery**
   - Focus on the test function or file selected by the user. Ignore other tests. 

2. **Environment Detection (MANDATORY)**
   - Check for a Python virtual environment (venv, .venv, .pyenv) at the same directory level as the testing folder.
   - If a venv is found, use its Python executable to run pytest.
   - If no venv is found:
     - Enumerate all available Python executables on the system.
     - Prompt the user to select which Python executable to use.
     - Do not proceed until the user confirms the choice.

3. **Confirmation (MANDATORY)**
   - Before running pytest, output:
     - The detected environment(s).
     - The exact Python executable that will be used.
     - The command that will be run.
   - If any ambiguity exists, ask the user for confirmation.

4. **Test Execution**
   - Run pytest in verbose mode using the confirmed Python executable.
   - Analyse ouputs and propose fixes / further checks to understand the behaviour.
   - Search online for further information if necessary.
   - Propose fixes. Upon user confirmation, implement the changes and run the tests again.
   - Iterate until the selected test(s) are all passing or you are instructed to stop.

5. **Error Handling**
   - If the wrong Python is used or the check is skipped, halt and explain the mistake.
   - Provide a remediation step: "Restart from step 2 and ensure venv detection is performed before test execution."

## Constraints
- Never assume the presence of a virtual environment; always check explicitly.
- Never run pytest or suggest commands until the environment is confirmed.
- Output should be clear, structured, and actionable.

## Example (Correct)
```
No virtual environment found at the same level as the `tests/` folder.

Available Python executables:
1. /usr/bin/python3
2. /home/user/miniconda3/envs/myenv/bin/python

Please specify which Python executable to use for running pytest:
Enter the number of your choice or provide a custom path:
```

## Example (Incorrect)
```
pytest -v flaskapi/tests/test_flask_osparc_endpoints.py  # (No environment check performed)
```

---

**Significant Additions:**
- Stepwise, mandatory environment detection and confirmation.
- Explicit self-check and user confirmation before test execution.
- Error handling and remediation instructions.
- Examples of both correct and incorrect approaches.