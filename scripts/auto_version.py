#!/usr/bin/env python3
"""Version helper for the auto-tag GitHub-release flow.

The version is single-sourced from `.bumpversion.cfg`'s `current_version`
and fanned out across every `[bumpversion:file:*]` entry (SPEC.md §V5).
Two channels, mirroring itis-sumo's alpha flow but without any package
index (GitHub releases only):

* develop: the auto-tag bot appends/increments a `.devN` counter
  (`1.6.3 -> 1.6.3.dev1 -> 1.6.3.dev2 ...`), commits it, and ships a
  GitHub prerelease `vX.Y.Z.devN`.
* main: the bot strips `.devN` (the base must already be bumped past the
  highest tag), commits the stable version, tags `vX.Y.Z` and creates the
  GitHub release.

Subcommands print the resulting version on stdout; failures exit 1 with an
actionable message on stderr.
"""

from __future__ import annotations

import argparse
import configparser
import re
import subprocess
import sys
from pathlib import Path

from packaging.version import InvalidVersion, Version

CONFIG_FILE = Path(".bumpversion.cfg")
# Only `X.Y.Z` and `X.Y.Z.devN` shapes are legal; anything else (aN, rc1,
# post, local labels...) is off-limits for this service.
VERSION_FORM = re.compile(r"^(?P<base>\d+\.\d+\.\d+)(?:\.dev(?P<dev>\d+))?$")


def config_from_text(text: str) -> configparser.RawConfigParser:
    parser = configparser.RawConfigParser()
    parser.read_string(text)
    return parser


def read_config_text(path: Path = CONFIG_FILE) -> str:
    return path.read_text()


def read_config_text_from_ref(ref: str) -> str:
    try:
        return subprocess.check_output(
            ["git", "show", f"{ref}:{CONFIG_FILE}"], text=True, stderr=subprocess.DEVNULL
        )
    except subprocess.CalledProcessError:
        # GitHub PR runners serve the base branch under origin/; dev clones
        # (fork + upstream remotes) may only carry it under upstream/.
        fallback = ref.replace("origin/", "upstream/", 1)
        return subprocess.check_output(
            ["git", "show", f"{fallback}:{CONFIG_FILE}"], text=True
        )


def current_version(parser: configparser.RawConfigParser) -> str:
    return parser["bumpversion"]["current_version"].strip()


def parse_form(version: str, *, source: str = "current version") -> tuple[str, int | None]:
    match = VERSION_FORM.match(version)
    if match is None:
        raise SystemExit(
            f"invalid version form {version!r} ({source}); expected X.Y.Z or X.Y.Z.devN"
        )
    dev = match["dev"]
    return match["base"], None if dev is None else int(dev)


def versioned_files(parser: configparser.RawConfigParser) -> list[tuple[str, str, str]]:
    files = []
    for section in parser.sections():
        if not section.startswith("bumpversion:file:"):
            continue
        path = section.removeprefix("bumpversion:file:")
        files.append((path, parser[section]["search"], parser[section]["replace"]))
    if not files:
        raise SystemExit(f"no [bumpversion:file:*] sections found in {CONFIG_FILE}")
    return files


def existing_tags() -> list[Version]:
    tags = subprocess.check_output(["git", "tag", "--list", "v*"], text=True)
    versions: list[Version] = []
    for tag in tags.splitlines():
        try:
            versions.append(Version(tag.removeprefix("v")))
        except InvalidVersion:
            continue
    return versions


def ensure_newer(candidate: Version, what: str, *, release_hint: str) -> None:
    tags = existing_tags()
    blockers = [tag for tag in tags if tag >= candidate]
    if blockers:
        highest = max(blockers)
        details = ", ".join(f"v{tag}" for tag in sorted(blockers, reverse=True)[:5])
        raise SystemExit(
            f"{what} {candidate} is not newer than existing tag(s): {details}. {release_hint}"
            f" (highest tag: v{highest})"
        )


def next_dev_version(current: str) -> str:
    base, dev = parse_form(current)
    parsed_current = Version(current)
    number = 1 if dev is None else dev + 1
    # Clamp above any dev tag already published for this base (e.g. history
    # rewound or a rebased cycle re-entered at the same base).
    same_base_devs = [
        tag.dev
        for tag in existing_tags()
        if tag.release == parsed_current.release and tag.dev is not None
    ]
    number = max(number, max(same_base_devs, default=0) + 1)
    candidate = Version(f"{base}.dev{number}")
    ensure_newer(
        candidate,
        "develop dev version",
        release_hint=(
            "A stable tag at this base was already released; bump the base on "
            "develop with `make version-patch` (or -minor/-major) and merge again."
        ),
    )
    return str(candidate)


def stripped_version(current: str, allow_taken: bool = False) -> str:
    base, dev = parse_form(current, source="version on main")
    candidate = Version(base)
    if not allow_taken:
        hint = (
            "main carries no dev suffix and this version is already tagged; "
            "the base must be bumped on develop (`make version-patch`) before "
            "the next release."
            if dev is None
            else (
                "the base was not bumped past the last release; bump it on develop "
                "(`make version-patch`) and re-open the release PR."
            )
        )
        ensure_newer(candidate, "release version", release_hint=hint)
    return str(candidate)


def dev_tags() -> list[str]:
    """Same-base `.devN` tags of the current version, oldest first.

    Lets the workflow recover prereleases stranded by a partial run (tag
    created server-side but release failed). Once the base moves on, older
    cycles' stranded tags are out of scope by design.
    """
    base, _ = parse_form(current_version(config_from_text(read_config_text())))
    parsed = Version(base)
    same_base = [
        tag
        for tag in existing_tags()
        if tag.release == parsed.release and tag.dev is not None
    ]
    return [f"v{tag}" for tag in sorted(same_base)]


def apply_version(parser: configparser.RawConfigParser, current: str, target: str) -> int:
    parse_form(target, source="--to target")
    changed = 0
    # bump2version owns `current_version` in the config itself, so it never
    # appears as a [bumpversion:file:*] entry; rewrite it explicitly.
    config_text = CONFIG_FILE.read_text()
    updated_config, count = re.subn(
        r"^(current_version = ).+$",
        rf"\g<1>{target}",
        config_text,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise SystemExit(f"could not find current_version line in {CONFIG_FILE}")
    if updated_config != config_text:
        CONFIG_FILE.write_text(updated_config)
        changed += 1
    for path_text, search_tpl, replace_tpl in versioned_files(parser):
        search = search_tpl.replace("{current_version}", current)
        replace = replace_tpl.replace("{new_version}", target)
        path = Path(path_text)
        if not path.is_file():
            raise SystemExit(f"versioned file missing: {path}")
        text = path.read_text()
        # The (?!\.dev\d) guard stops a bare `X.Y.Z` search from matching
        # inside an already-stamped `X.Y.Z.devN` (e.g. a CI re-run of apply
        # after .bumpversion.cfg was rewritten but before files were).
        pattern = re.compile(re.escape(search) + r"(?!\.dev\d)")
        if pattern.search(text):
            updated = pattern.sub(lambda match: replace, text)
            if updated != text:
                path.write_text(updated)
                changed += 1
        elif replace not in text:
            raise SystemExit(
                f"{path}: expected {search!r} per [bumpversion:file:{path}] "
                "but found neither it nor the target string (version drift?)"
            )
    return changed


def check_fanout(parser: configparser.RawConfigParser, current: str) -> None:
    stale = []
    for path_text, search_tpl, _ in versioned_files(parser):
        search = search_tpl.replace("{current_version}", current)
        path = Path(path_text)
        pattern = re.compile(re.escape(search) + r"(?!\.dev\d)")
        if not path.is_file() or pattern.search(path.read_text()) is None:
            stale.append(str(path))
    if stale:
        raise SystemExit(
            "version fanout drift (§V5): these files do not carry "
            f"current_version {current!r}: {', '.join(stale)}. "
            "Bump with `make version-{patch|minor|major}`, not per-file."
        )


def cmd_next_dev(parser: configparser.RawConfigParser) -> None:
    print(next_dev_version(current_version(parser)))


def cmd_apply(parser: configparser.RawConfigParser, to: str) -> None:
    current = current_version(parser)
    changed = apply_version(parser, current, to)
    print(f"applied {to} across {changed} file(s)", file=sys.stderr)
    print(to)


def cmd_check_pr(parser: configparser.RawConfigParser, target: str) -> None:
    head = current_version(parser)
    check_fanout(parser, head)
    base_parser = config_from_text(read_config_text_from_ref(f"origin/{target}"))
    base = current_version(base_parser)
    if target == "develop":
        if head == base:
            print(f"develop: {head} unchanged, ok")
            return
        stable_base, dev = parse_form(head, source="PR head version")
        if dev is not None:
            raise SystemExit(
                f"the .devN suffix belongs to the auto-tag bot; a PR may only "
                f"change the base version (found {head})"
            )
        base_clean, _ = parse_form(base, source=f"origin/{target} version")
        if Version(stable_base) <= Version(base_clean):
            raise SystemExit(
                f"PR base {head} must exceed {target}'s current base "
                f"{base_clean}; the branch state is stale — rebase on {target} "
                "and bump again (removing the bot's .devN suffix by hand is "
                "never valid)"
            )
        ensure_newer(
            Version(stable_base),
            "PR base version",
            release_hint="this PR's base bump is stale; branch/rebase and bump again. ",
        )
        print(f"develop: PR bumps base {base} -> {head}, ok")
    elif target == "main":
        candidate = stripped_version(head)
        print(f"main: release {candidate} (from {head}) clears all tags, ok")
    else:
        raise SystemExit(f"unsupported PR target: {target}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("next-dev", help="print the next develop .devN version")
    sub.add_parser("dev-tags", help="list same-base dev tags of the current base, oldest first")
    strip_p = sub.add_parser("strip-dev", help="print the stable version after stripping .devN")
    strip_p.add_argument(
        "--allow-taken",
        action="store_true",
        help="skip the newer-than-tags assertion (workflow resume detection)",
    )
    apply_p = sub.add_parser("apply", help="rewrite current_version across all files")
    apply_p.add_argument("--to", required=True, help="target version (X.Y.Z[.devN])")
    check_p = sub.add_parser("check-pr", help="validate a PR's version for its target")
    check_p.add_argument("--target", required=True, help="PR base branch")
    args = parser.parse_args()

    if not CONFIG_FILE.is_file():
        raise SystemExit(f"run from the repo root: {CONFIG_FILE} not found")
    config = config_from_text(read_config_text())
    if args.command == "next-dev":
        cmd_next_dev(config)
    elif args.command == "dev-tags":
        for tag in dev_tags():
            print(tag)
    elif args.command == "strip-dev":
        print(stripped_version(current_version(config), allow_taken=args.allow_taken))
    elif args.command == "apply":
        cmd_apply(config, args.to)
    elif args.command == "check-pr":
        cmd_check_pr(config, args.target)


if __name__ == "__main__":
    main()
