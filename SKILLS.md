# SKILLS.md — AI Agents Hackathon

This file defines how the AI assistant should behave, think, and execute tasks throughout this project. Read this fully before doing anything.

---

## 1. Code Changes & Patching

- **Never edit files directly.** Always output a unified diff patch.
- Format every patch like this:

```diff
--- a/path/to/file.py
+++ b/path/to/file.py
@@ -10,6 +10,10 @@
 existing line
-removed line
+added line
 existing line
```

- One patch per logical change. If the task touches 3 things, produce 3 patches.
- After showing the patch, wait for confirmation before proceeding.

---

## 2. Commit Messages

Always suggest a commit message at the end of every patch using Conventional Commits:

```
feat: add memory retrieval tool to research agent
fix: handle empty response from LLM in loop
chore: add python-dotenv to requirements.txt
refactor: extract tool registry into separate module
docs: update README with agent architecture diagram
test: add unit test for tool-calling loop
```

Rules:
- One line, imperative tense ("add" not "added")
- Lowercase after the prefix
- No period at the end
- If it's a breaking change, add `!` → `feat!: redesign agent memory interface`

---

## 3. Task Execution Flow

Before writing a single line of code, always follow this sequence:

```
1. Restate the goal in one sentence.
2. List every file you plan to touch.
3. Flag any risks or unknowns.
4. Show the patch(es).
5. Suggest the commit message.
```

Never skip a step even for small changes.

---

## 4. Agent Architecture Conventions

- Each agent lives in its own file: `agents/<agent_name>.py`
- Tools live in `tools/<tool_name>.py` — one tool per file
- Shared utilities go in `utils/`
- Entry point is always `main.py`
- Agent configs (model, temperature, system prompt) go in `config.py` or `agents/<name>.yaml`

Directory structure to follow:

```
project/
├── agents/
│   └── researcher.py
├── tools/
│   └── web_search.py
├── utils/
│   └── logger.py
├── config.py
├── main.py
├── .env
├── requirements.txt
└── SKILLS.md
```

---

## 5. Environment & Secrets

- **Never hardcode API keys, tokens, or secrets.**
- Always use `.env` via `python-dotenv` or equivalent.
- When you add a new secret, also add a placeholder to `.env.example`:

```
OPENAI_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

- Remind me to add the real value to `.env` after showing the patch.

---

## 6. Dependency Management

- Every new library must be added to `requirements.txt` (Python) or `package.json` (Node).
- Pin versions for stability: `langchain==0.2.1` not just `langchain`
- Group dependencies in `requirements.txt` with comments:

```
# LLM & Agents
langchain==0.2.1
openai==1.30.0

# Tools
tavily-python==0.3.3

# Utils
python-dotenv==1.0.1
```

---

## 7. Logging & Debugging

- Every agent must log at key steps: tool call, LLM response, loop iteration.
- Use Python's `logging` module, not `print()`.
- Log format: `[AgentName] action — detail`
- Example: `[ResearchAgent] calling tool — web_search("climate change 2025")`

---

## 8. Error Handling

- Wrap all LLM calls and tool calls in try/except.
- Never let the agent crash silently — always log the error and either retry or fail gracefully.
- For tool failures, return a structured error object back to the agent:

```python
{"error": True, "message": "Tool failed: <reason>", "tool": "web_search"}
```

---

## 9. Prompting Conventions

- System prompts go in a dedicated variable or file — never inline in the agent call.
- Always label prompt variables clearly: `SYSTEM_PROMPT`, `TOOL_DESCRIPTION`, `FEW_SHOT_EXAMPLES`
- When editing a prompt, treat it like code — show it as a patch, not a full replacement dump.

---

## 10. What NOT To Do

- ❌ Don't apply changes without showing a patch first
- ❌ Don't add a library without updating requirements.txt
- ❌ Don't hardcode any key or secret
- ❌ Don't write an agent without error handling
- ❌ Don't use print() for debugging — use logging
- ❌ Don't put everything in main.py — keep it modular
- ❌ Don't suggest a vague commit like `fix: stuff` or `chore: updates`
