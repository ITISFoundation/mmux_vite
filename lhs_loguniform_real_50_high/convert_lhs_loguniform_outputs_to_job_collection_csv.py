from __future__ import annotations

import argparse
import csv
import json
from io import StringIO
from pathlib import Path


def _job_uid_from_path(path: Path) -> str:
    suffix = "_output"
    stem = path.stem[:-len(suffix)] if path.stem.endswith(suffix) else path.stem
    return stem


def _load_rows(input_dir: Path) -> tuple[list[str], list[dict[str, str]]]:
    json_files = sorted(input_dir.glob("*.json"))
    rows: list[tuple[int, dict[str, str]]] = []
    output_keys: set[str] = set()

    for path in json_files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("is_reference") is True:
            continue

        metrics = data.get("metrics", {})
        if not isinstance(metrics, dict):
            raise ValueError(f"Missing metrics object in {path}")

        output_keys.update(metrics.keys())
        rows.append(
            (
                int(data["sample_id"]),
                {
                    "source_job_uid": _job_uid_from_path(path),
                    "status": "SUCCESS",
                    "input__pair_1_current": str(data["pair_1_current"]),
                    "input__pair_2_current": str(data["pair_2_current"]),
                    **{f"output__{key}": str(metrics[key]) for key in metrics},
                },
            )
        )

    sorted_output_keys = sorted(output_keys)
    serialized_rows = [row for _, row in sorted(rows, key=lambda item: item[0])]
    return sorted_output_keys, serialized_rows


def build_csv(input_dir: Path) -> str:
    output_keys, rows = _load_rows(input_dir)
    fieldnames = [
        "source_job_uid",
        "status",
        "input__pair_1_current",
        "input__pair_2_current",
        *[f"output__{key}" for key in output_keys],
    ]

    buffer_lines = [
        "# schema_version,2",
        f"# source_job_collection_uid,{input_dir.name}",
        f"# source_job_collection_title,{input_dir.name}",
        "# source_function_uid,",
        f"# source_function_title,{input_dir.name}",
        "# source_description,Local import generated from JSON output files",
    ]

    csv_buffer = StringIO()
    csv_buffer.write("\n".join(buffer_lines))
    csv_buffer.write("\n")
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return csv_buffer.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert lhs_loguniform JSON output files into an uploadable JobCollection CSV."
    )
    parser.add_argument(
        "input_dir",
        nargs="?",
        default="lhs_loguniform_real_50_high",
        help="Directory containing *_output.json files",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional output CSV path. Defaults to <input_dir>/job_collection_import.csv",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir).resolve()
    output_path = Path(args.output).resolve() if args.output else input_dir / "job_collection_import.csv"

    csv_content = build_csv(input_dir)
    output_path.write_text(csv_content, encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
