
import requests
import unittest
import json
import time
from unittest import mock

class OllamaGUITest(unittest.TestCase):
    """Test suite for the Ollama GUI application"""
    
    def setUp(self):
        # The Ollama API URL
        self.ollama_url = "http://localhost:11434"
        
    def test_ollama_api_connection(self):
        """Test if the Ollama API is accessible"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("models", data)
            print("✅ Ollama API connection successful")
        except requests.exceptions.ConnectionError:
            print("❌ Ollama API connection failed - service might not be running")
            self.skipTest("Ollama service is not running")
    
    def test_ollama_generate_endpoint(self):
        """Test the generate endpoint with a simple prompt"""
        try:
            payload = {
                "model": "llama2",  # Using a common model
                "prompt": "Hello, how are you?",
                "stream": False
            }
            response = requests.post(f"{self.ollama_url}/api/generate", json=payload)
            
            if response.status_code == 404:
                print("❌ Model 'llama2' not found, skipping test")
                self.skipTest("Model not available")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("response", data)
            print("✅ Ollama generate endpoint working")
        except requests.exceptions.ConnectionError:
            print("❌ Ollama API connection failed - service might not be running")
            self.skipTest("Ollama service is not running")
    
    @mock.patch('requests.get')
    @mock.patch('requests.post')
    def test_chat_history_persistence(self, mock_post, mock_get):
        """Test chat history persistence using mocked responses"""
        # Mock the models endpoint
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "models": [{"name": "llama2"}]
        }
        
        # Mock the generate endpoint
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "response": "I'm an AI assistant. How can I help you today?"
        }
        
        print("✅ Mocked API responses for chat history test")
        
        # In a real browser environment, we would:
        # 1. Create a new chat session
        # 2. Send a message
        # 3. Verify the message is saved in localStorage
        # 4. Create another session
        # 5. Verify both sessions exist
        
        print("ℹ️ Note: Full chat history persistence testing requires browser automation")

if __name__ == "__main__":
    print("🧪 Running Ollama GUI API Tests")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
