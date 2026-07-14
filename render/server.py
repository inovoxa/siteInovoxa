import http.server, socketserver, os

PORT = 8808
ROOT = os.getcwd()  # raiz do projeto (o launch roda daqui)

class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/render/render.html'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/save':
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            out = os.path.join(ROOT, 'render', 'output.webm')
            with open(out, 'wb') as f:
                f.write(data)
            print('SALVO', len(data), 'bytes em', out, flush=True)
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'ok')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), H) as httpd:
    print("render server on", PORT, flush=True)
    httpd.serve_forever()
