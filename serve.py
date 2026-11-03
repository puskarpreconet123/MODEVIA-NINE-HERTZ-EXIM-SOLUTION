import http.server
import socketserver
import os
import sys

PORT = 8080

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Resolve requested path relative to current working directory
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            # If requesting a route without file extension (SPA route), serve index.html
            self.path = '/index.html'
        return super().do_GET()

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", port), SPAHandler) as httpd:
        print(f"Serving Modevia Ninehertz clone at http://localhost:{port}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    main()
