"""
Ember Code — filesystem + shell tools for the agent, scoped to a per-session
sandboxed workspace.

Every chat session (thread_id) gets its own directory under EMBER_WORKSPACE_ROOT.
The tools resolve all paths *inside* that directory and refuse to escape it, so
the agent can read, write, edit, and run code without touching the rest of the
host. The active workspace is selected per request via set_workspace().

Note: run_command executes in the workspace with a timeout and a small blocklist
of catastrophic patterns. For hard isolation, run the backend itself in a
container; this confines file paths but does not fully sandbox the shell.
"""

import contextvars
import os
import subprocess
from pathlib import Path

from langchain_core.tools import tool

# Where all session workspaces live.
WORKSPACE_ROOT = Path(
    os.getenv("EMBER_WORKSPACE_ROOT", str(Path(__file__).resolve().parent.parent / "workspaces"))
).resolve()
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

# The active workspace for the current request. A contextvar (async-safe) with a
# module-level mirror as a fallback for sync tool execution in worker threads.
_ws_var: contextvars.ContextVar[Path] = contextvars.ContextVar("ember_workspace")
_ws_fallback: Path = WORKSPACE_ROOT / "default"

MAX_READ_CHARS = 12000
COMMAND_TIMEOUT = 30
_BLOCKED = (
    "rm -rf /",
    "rm -rf ~",
    "rm -rf /*",
    ":(){",           # fork bomb
    "mkfs",
    "dd if=",
    "> /dev/sda",
    "/dev/sda",
    "shutdown",
    "reboot",
    "sudo ",
)


def _sanitize(thread_id: str) -> str:
    safe = "".join(c for c in (thread_id or "default") if c.isalnum() or c in "-_")
    return safe or "default"


def set_workspace(thread_id: str) -> Path:
    """Select (creating if needed) the workspace for a session. Call once per request."""
    global _ws_fallback
    ws = (WORKSPACE_ROOT / _sanitize(thread_id)).resolve()
    ws.mkdir(parents=True, exist_ok=True)
    _ws_var.set(ws)
    _ws_fallback = ws
    return ws


def _workspace() -> Path:
    try:
        return _ws_var.get()
    except LookupError:
        _ws_fallback.mkdir(parents=True, exist_ok=True)
        return _ws_fallback


def _resolve(rel_path: str) -> Path:
    """Resolve a user-supplied path inside the workspace, refusing to escape it."""
    ws = _workspace()
    target = (ws / (rel_path or ".")).resolve()
    if target != ws and ws not in target.parents:
        raise ValueError(f"path '{rel_path}' escapes the workspace")
    return target


@tool
def list_dir(path: str = ".") -> str:
    """List files and folders at a path (relative to the workspace root)."""
    try:
        target = _resolve(path)
    except ValueError as e:
        return f"Error: {e}"
    if not target.exists():
        return f"Error: '{path}' does not exist."
    if target.is_file():
        return f"{path} is a file ({target.stat().st_size} bytes)."
    entries = sorted(target.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
    if not entries:
        return f"{path} is empty."
    lines = []
    for p in entries:
        if p.is_dir():
            lines.append(f"{p.name}/")
        else:
            lines.append(f"{p.name}  ({p.stat().st_size} bytes)")
    return "\n".join(lines)


@tool
def read_file(path: str) -> str:
    """Read a UTF-8 text file from the workspace and return its contents."""
    try:
        target = _resolve(path)
    except ValueError as e:
        return f"Error: {e}"
    if not target.exists() or not target.is_file():
        return f"Error: file '{path}' not found."
    try:
        text = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return f"Error: '{path}' is not a UTF-8 text file."
    if len(text) > MAX_READ_CHARS:
        return text[:MAX_READ_CHARS] + f"\n\n[truncated — file is {len(text)} chars]"
    return text or "(empty file)"


@tool
def write_file(path: str, content: str) -> str:
    """Create or overwrite a text file in the workspace with the given content."""
    try:
        target = _resolve(path)
    except ValueError as e:
        return f"Error: {e}"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    lines = content.count("\n") + 1 if content else 0
    return f"Wrote {lines} line(s) to {path}."


@tool
def edit_file(path: str, old: str, new: str) -> str:
    """Replace the exact string `old` with `new` in a file. `old` must occur exactly once."""
    try:
        target = _resolve(path)
    except ValueError as e:
        return f"Error: {e}"
    if not target.exists() or not target.is_file():
        return f"Error: file '{path}' not found."
    try:
        text = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return f"Error: '{path}' is not a UTF-8 text file."
    count = text.count(old)
    if count == 0:
        return "Error: `old` string not found. Read the file and match it exactly."
    if count > 1:
        return f"Error: `old` appears {count} times — include more surrounding context so it is unique."
    target.write_text(text.replace(old, new, 1), encoding="utf-8")
    return f"Edited {path}."


@tool
def run_command(command: str) -> str:
    """Run a shell command in the workspace directory. Returns stdout+stderr; times out after 30s."""
    lowered = command.lower()
    if any(bad in lowered for bad in _BLOCKED):
        return "Error: command refused — it matches a blocked destructive pattern."
    ws = _workspace()
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=str(ws),
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        return f"Error: command timed out after {COMMAND_TIMEOUT}s."
    out = (result.stdout or "") + (result.stderr or "")
    out = out.strip() or "(no output)"
    if len(out) > MAX_READ_CHARS:
        out = out[:MAX_READ_CHARS] + "\n\n[truncated]"
    return f"exit {result.returncode}\n{out}"


CODING_TOOLS = [list_dir, read_file, write_file, edit_file, run_command]


# --- Read-only helpers for the Ember Code UI (browse a session's workspace) ---

_IGNORE = {".git", "__pycache__", "node_modules", ".venv", "venv", ".next", ".DS_Store"}


def workspace_path(thread_id: str) -> Path:
    ws = (WORKSPACE_ROOT / _sanitize(thread_id)).resolve()
    ws.mkdir(parents=True, exist_ok=True)
    return ws


def list_tree(thread_id: str, max_entries: int = 500) -> list[dict]:
    """Flat list of files/dirs in a session workspace, for the file panel."""
    ws = workspace_path(thread_id)
    items: list[dict] = []
    for p in sorted(ws.rglob("*"), key=lambda x: str(x).lower()):
        rel = p.relative_to(ws)
        if any(part in _IGNORE for part in rel.parts):
            continue
        items.append({
            "path": str(rel),
            "type": "dir" if p.is_dir() else "file",
            "size": p.stat().st_size if p.is_file() else 0,
        })
        if len(items) >= max_entries:
            break
    return items


def read_workspace_file(thread_id: str, path: str, max_chars: int = 200000) -> str:
    """Read a file from a session workspace (confined), for the file viewer."""
    ws = workspace_path(thread_id)
    target = (ws / path).resolve()
    if target != ws and ws not in target.parents:
        return "Error: path escapes the workspace."
    if not target.is_file():
        return "Error: file not found."
    try:
        text = target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "(binary file — cannot display)"
    return text[:max_chars]
