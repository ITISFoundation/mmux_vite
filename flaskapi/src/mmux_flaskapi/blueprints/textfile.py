from pathlib import Path
import json
import logging
from typing import Final
#
from flask import request, jsonify, Blueprint
#

textfile_bp = Blueprint("text-file", __name__)


_logger = logging.getLogger(__name__)


FILES_STORAGE_DIR: Final[Path] = Path("/text-files")


@textfile_bp.route("/", methods=["POST"])
def save_file():
    """Create or update a text file in the FILES_STORAGE_DIR folder.
    Request body should be JSON with 'filename' and 'content' fields."""
    try:
        request_data = json.loads(request.data.decode("utf-8"))
        _logger.debug(f"Request data: {request_data}")

        if "filename" not in request_data or "content" not in request_data:
            return jsonify({"error": "Request must include both filename and content"}), 400
        
        filename = request_data["filename"]
        content = request_data["content"]
        
        # Basic filename validation - prevent path traversal
        if "/" in filename or "\\" in filename:
            return jsonify({"error": "Invalid filename. Must not contain path separators"}), 400
            
        file_path = FILES_STORAGE_DIR / filename
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        _logger.info(f"File saved: {filename}")
        return jsonify({"status": "success", "filename": filename}), 200
    
    except Exception as e:
        _logger.error(f"Error saving file: {e}")
        return jsonify({"error": str(e)}), 500

@textfile_bp.route("/<filename>", methods=["GET"])
def get_file(filename):
    """Retrieve the content of a text file from the FILES_STORAGE_DIR folder."""
    try:
        # Basic filename validation - prevent path traversal
        if "/" in filename or "\\" in filename:
            return jsonify({"error": "Invalid filename. Must not contain path separators"}), 400
            
        file_path = FILES_STORAGE_DIR / filename
        
        if not file_path.exists():
            return jsonify({"error": f"File {filename} not found"}), 404
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return jsonify({"filename": filename, "content": content}), 200
    
    except Exception as e:
        _logger.error(f"Error retrieving file {filename}: {e}")
        return jsonify({"error": str(e)}), 500
    