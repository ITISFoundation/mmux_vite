Here is an expert-level prompt for Python test debugging using pytest, following the structure and quality guidelines from your `refine_prompt.prompt.md`:

---

# Python Test Debugging with Pytest

## Objective

Efficiently debug Python tests using pytest, ensuring the correct Python environment is used. If no virtual environment (venv, .venv, .pyenv directory) is found at the same level as the testing folder, explicitly prompt the user to specify which Python executable should be used.

## Instructions

1. **Test Discovery and Execution**
   - Locate all test files within the designated testing folder.
   - Attempt to discover and run tests using pytest.

2. **Environment Detection**
   - Check if a Python virtual environment (venv) exists at the same directory level as the testing folder.
   - If a venv is found, use its Python executable to run pytest.
   - If no venv is found:
     - Prompt the user to specify which Python executable should be used (e.g., system Python, conda environment, or a custom path).
     - Clearly display available Python executables if possible.

3. **Debugging Workflow**
   - Run pytest in verbose mode to capture detailed output.
   - If tests fail, provide actionable debugging information, including:
     - The exact command used to run pytest.
     - The Python executable path.
     - The full traceback and error messages.
   - Suggest common troubleshooting steps (e.g., checking dependencies, environment variables, or test isolation).

4. **User Interaction**
   - If user input is required (e.g., selecting a Python executable), ask clear, concise questions and provide context-sensitive options.
   - Confirm the selected environment before proceeding with test execution.

## Constraints

- Do not assume the presence of a virtual environment; always check explicitly.
- Ensure all commands and paths are compatible with the user's operating system and shell.
- Avoid hardcoding Python paths; always verify or prompt for user confirmation.
- Output should be clear, structured, and actionable for both novice and expert users.

## Example

```markdown
No virtual environment found at the same level as the `tests/` folder.

Please specify which Python executable to use for running pytest:
1. /usr/bin/python3 (system Python)
2. /home/user/miniconda3/envs/myenv/bin/python (conda environment)
3. [Enter custom path]

Enter the number of your choice or provide a custom path:
```

---

**Significant Additions:**
- Explicit user prompt for Python executable selection if no venv is found.
- Structured instructions for environment detection and user interaction.
- Example user prompt for clarity.