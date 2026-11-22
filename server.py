# Liten lokal webbserver för Lärospel som säger åt webbläsaren att aldrig cacha filerna.
# Då räcker vanlig F5 för att se ändringar.
import functools
import http.server
import os
import sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8123


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


print(f'Larospel kor pa http://localhost:{PORT}  (Ctrl+C for att stoppa)')
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(NoCacheHandler, directory=ROOT)).serve_forever()
