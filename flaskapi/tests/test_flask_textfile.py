"""
Comprehensive tests for textfile endpoints.

This module tests all text file management functionality including:
- File saving with valid content
- File retrieval 
- File validation and security
- Error handling for missing files
- Path traversal protection
- Content encoding handling
- Edge cases and error conditions
"""

import os
import tempfile
import pytest
from unittest.mock import patch, mock_open
from pathlib import Path
import json


class TestTextFileEndpoints:
    """Test class for text file management endpoints."""

    def test_save_file_success(self, test_client):
        """Test successful file saving."""
        payload = {
            "filename": "test.txt",
            "content": "Hello, World!"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "test.txt"
            
            # Verify that the file was opened for writing
            mock_file.assert_called_once()
            args, kwargs = mock_file.call_args
            assert kwargs.get("encoding") == "utf-8"
            assert "w" in args

    def test_save_file_with_multiline_content(self, test_client):
        """Test saving a file with multiline content."""
        payload = {
            "filename": "multiline.txt",
            "content": "Line 1\nLine 2\nLine 3\n"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "multiline.txt"

    def test_save_file_with_special_characters(self, test_client):
        """Test saving a file with special characters and Unicode."""
        payload = {
            "filename": "special.txt",
            "content": "Special chars: áéíóú ñ © ® ™ 中文 🚀"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "special.txt"

    def test_save_file_empty_content(self, test_client):
        """Test saving a file with empty content."""
        payload = {
            "filename": "empty.txt",
            "content": ""
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "empty.txt"

    def test_save_file_missing_filename(self, test_client):
        """Test saving a file without filename."""
        payload = {
            "content": "Hello, World!"
        }
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "filename" in data["error"]
        assert "content" in data["error"]

    def test_save_file_missing_content(self, test_client):
        """Test saving a file without content."""
        payload = {
            "filename": "test.txt"
        }
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "filename" in data["error"]
        assert "content" in data["error"]

    def test_save_file_missing_both_fields(self, test_client):
        """Test saving a file without filename and content."""
        payload = {}
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "filename" in data["error"]
        assert "content" in data["error"]

    def test_save_file_path_traversal_attack_forward_slash(self, test_client):
        """Test that path traversal with forward slashes is blocked."""
        payload = {
            "filename": "../../../etc/passwd",
            "content": "malicious content"
        }
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "path separators" in data["error"]

    def test_save_file_path_traversal_attack_backslash(self, test_client):
        """Test that path traversal with backslashes is blocked."""
        payload = {
            "filename": "..\\..\\..\\windows\\system32\\config",
            "content": "malicious content"
        }
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "path separators" in data["error"]

    def test_save_file_path_traversal_mixed_separators(self, test_client):
        """Test that mixed path separators are blocked."""
        payload = {
            "filename": "../folder\\file.txt",
            "content": "malicious content"
        }
        
        response = test_client.post("/text-file/", json=payload)
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "path separators" in data["error"]

    def test_save_file_invalid_json(self, test_client):
        """Test saving with invalid JSON data."""
        response = test_client.post("/text-file/", 
                                  data="invalid json",
                                  content_type='application/json')
        assert response.status_code == 500
        
        data = response.get_json()
        assert "error" in data

    def test_save_file_io_error(self, test_client):
        """Test handling of file I/O errors."""
        payload = {
            "filename": "test.txt",
            "content": "Hello, World!"
        }
        
        with patch("builtins.open", side_effect=IOError("Permission denied")):
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 500
            
            data = response.get_json()
            assert "error" in data
            assert "Permission denied" in data["error"]

    def test_get_file_success(self, test_client):
        """Test successful file retrieval."""
        file_content = "Hello, World!"
        
        with patch("builtins.open", mock_open(read_data=file_content)):
            with patch("pathlib.Path.exists", return_value=True):
                response = test_client.get("/text-file/test.txt")
                assert response.status_code == 200
                
                data = response.get_json()
                assert data["filename"] == "test.txt"
                assert data["content"] == file_content

    def test_get_file_with_multiline_content(self, test_client):
        """Test retrieving a file with multiline content."""
        file_content = "Line 1\nLine 2\nLine 3\n"
        
        with patch("builtins.open", mock_open(read_data=file_content)):
            with patch("pathlib.Path.exists", return_value=True):
                response = test_client.get("/text-file/multiline.txt")
                assert response.status_code == 200
                
                data = response.get_json()
                assert data["filename"] == "multiline.txt"
                assert data["content"] == file_content

    def test_get_file_with_special_characters(self, test_client):
        """Test retrieving a file with special characters."""
        file_content = "Special chars: áéíóú ñ © ® ™ 中文 🚀"
        
        with patch("builtins.open", mock_open(read_data=file_content)):
            with patch("pathlib.Path.exists", return_value=True):
                response = test_client.get("/text-file/special.txt")
                assert response.status_code == 200
                
                data = response.get_json()
                assert data["filename"] == "special.txt"
                assert data["content"] == file_content

    def test_get_file_empty_content(self, test_client):
        """Test retrieving a file with empty content."""
        file_content = ""
        
        with patch("builtins.open", mock_open(read_data=file_content)):
            with patch("pathlib.Path.exists", return_value=True):
                response = test_client.get("/text-file/empty.txt")
                assert response.status_code == 200
                
                data = response.get_json()
                assert data["filename"] == "empty.txt"
                assert data["content"] == file_content

    def test_get_file_not_found(self, test_client):
        """Test retrieving a non-existent file."""
        with patch("pathlib.Path.exists", return_value=False):
            response = test_client.get("/text-file/nonexistent.txt")
            assert response.status_code == 404
            
            data = response.get_json()
            assert "error" in data
            assert "not found" in data["error"]
            assert "nonexistent.txt" in data["error"]

    def test_get_file_path_traversal_attack_forward_slash(self, test_client):
        """Test that path traversal attacks are blocked on file retrieval."""
        # Flask routing handles this as 404 for URL with path separators outside the parameter
        response = test_client.get("/text-file/../../../etc/passwd")
        # This returns 404 because Flask doesn't match the route pattern
        assert response.status_code == 404

    def test_get_file_path_traversal_attack_backslash(self, test_client):
        """Test that backslash path traversal attacks are blocked on file retrieval."""
        response = test_client.get("/text-file/..\\..\\windows\\system32\\config")
        assert response.status_code == 400
        
        data = response.get_json()
        assert "error" in data
        assert "path separators" in data["error"]

    def test_get_file_io_error(self, test_client):
        """Test handling of file I/O errors during retrieval."""
        with patch("pathlib.Path.exists", return_value=True):
            with patch("builtins.open", side_effect=IOError("Permission denied")):
                response = test_client.get("/text-file/test.txt")
                assert response.status_code == 500
                
                data = response.get_json()
                assert "error" in data
                assert "Permission denied" in data["error"]

    def test_method_not_allowed_put(self, test_client):
        """Test that PUT method is not allowed."""
        response = test_client.put("/text-file/", json={"filename": "test.txt", "content": "test"})
        assert response.status_code == 405

    def test_method_not_allowed_delete(self, test_client):
        """Test that DELETE method is not allowed."""
        response = test_client.delete("/text-file/test.txt")
        assert response.status_code == 405

    def test_method_not_allowed_patch(self, test_client):
        """Test that PATCH method is not allowed."""
        response = test_client.patch("/text-file/test.txt", json={"content": "new content"})
        assert response.status_code == 405

    def test_invalid_endpoint_routes(self, test_client):
        """Test that invalid routes return appropriate status codes."""
        # GET to root textfile endpoint returns 405 Method Not Allowed (only POST allowed)
        response = test_client.get("/text-file/")
        assert response.status_code == 405
        
        # Complex paths are handled by Flask routing as 404
        response = test_client.get("/text-file/invalid/path/with/slashes")
        assert response.status_code == 404

    def test_endpoint_url_prefix(self, test_client):
        """Test that text-file endpoints use the correct URL prefix."""
        # Test that endpoints without prefix don't work
        response = test_client.post("/", json={"filename": "test.txt", "content": "test"})
        assert response.status_code == 404
        
        response = test_client.get("/test.txt")
        assert response.status_code == 404

    def test_large_file_content(self, test_client):
        """Test saving and retrieving a file with large content."""
        large_content = "A" * 10000  # 10KB of content
        payload = {
            "filename": "large.txt",
            "content": large_content
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "large.txt"

    def test_filename_with_special_characters(self, test_client):
        """Test saving a file with special characters in filename (but no path separators)."""
        payload = {
            "filename": "test-file_2024.txt",
            "content": "Hello, World!"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "test-file_2024.txt"

    def test_filename_with_dots(self, test_client):
        """Test saving a file with dots in filename (but not path traversal)."""
        payload = {
            "filename": "file.backup.txt",
            "content": "Hello, World!"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "file.backup.txt"

    def test_save_overwrite_existing_file(self, test_client):
        """Test that saving overwrites existing files."""
        payload = {
            "filename": "existing.txt",
            "content": "New content"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "existing.txt"

    def test_content_type_handling(self, test_client):
        """Test that the endpoint handles different content types correctly."""
        payload = {
            "filename": "test.txt",
            "content": "Hello, World!"
        }
        
        # Test with explicit JSON content type
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", 
                                      data=json.dumps(payload),
                                      content_type='application/json')
            assert response.status_code == 200

    def test_save_file_numeric_content(self, test_client):
        """Test saving a file with numeric content."""
        payload = {
            "filename": "numbers.txt",
            "content": "123456789"
        }
        
        with patch("builtins.open", mock_open()) as mock_file:
            response = test_client.post("/text-file/", json=payload)
            assert response.status_code == 200
            
            data = response.get_json()
            assert data["status"] == "success"
            assert data["filename"] == "numbers.txt"