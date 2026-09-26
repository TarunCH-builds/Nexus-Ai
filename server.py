"""
NEXUS AI - Python Fallback Server
Ensures clean execution without ModuleNotFoundError even in minimal environments.
"""

import sys
import os
import json

# Handle flask_cors gracefully if installed or provide transparent fallback
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False

if HAS_FLASK:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "service": "Python Backend", "cors": "enabled"})

    @app.route('/api/chat', methods=['POST'])
    def chat():
        data = request.get_json() or {}
        return jsonify({
            "success": True,
            "answer": "NEXUS AI Python backend active with CORS enabled.",
            "intent": "GENERAL_CHAT"
        })

    if __name__ == '__main__':
        app.run(host='0.0.0.0', port=8000)
else:
    # Standard library fallback if Flask / Flask-CORS is not installed
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class SimpleCORSHandler(BaseHTTPRequestHandler):
        def _set_headers(self, status=200):
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()

        def do_OPTIONS(self):
            self._set_headers(200)

        def do_GET(self):
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "service": "Python Standard Library (CORS Enabled)"}).encode('utf-8'))

        def do_POST(self):
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "answer": "NEXUS Python backend responsive."}).encode('utf-8'))

    if __name__ == '__main__':
        server = HTTPServer(('0.0.0.0', 8000), SimpleCORSHandler)
        print("Starting Python backend on port 8000 with CORS support...")
        server.serve_forever()
