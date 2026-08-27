

import http .server
import os
import socketserver
import sys

os .chdir (os .path .join (os .path .dirname (os .path .abspath (__file__ )),"..",".."))

PORT =int (sys .argv [1 ])if len (sys .argv )>1 else 8000
MIME ={
**http .server .SimpleHTTPRequestHandler .extensions_map ,
".js":"text/javascript",
".mjs":"text/javascript",
".wasm":"application/wasm",
".css":"text/css",
".html":"text/html",
}

class Handler (http .server .SimpleHTTPRequestHandler ):
    extensions_map =MIME

    def end_headers (self ):
        self .send_header ("Cross-Origin-Opener-Policy","same-origin")
        self .send_header ("Cross-Origin-Embedder-Policy","credentialless")
        self .send_header ("Cache-Control","no-store")
        self .send_header ("X-Content-Type-Options","nosniff")
        self .send_header ("X-Frame-Options","DENY")
        self .send_header ("Referrer-Policy","strict-origin-when-cross-origin")
        self .send_header (
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), sync-xhr=()",
        )
        self .send_header (
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net "
        "https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "media-src 'self' blob: data:; "
        "connect-src 'self' blob: https://cdn.jsdelivr.net https://api.emailjs.com "
        "https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://va.vercel-scripts.com; "
        "worker-src 'self' blob: https://cdn.jsdelivr.net; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
        )
        super ().end_headers ()

class ThreadingServer (socketserver .ThreadingTCPServer ):
    allow_reuse_address =True

with ThreadingServer (("0.0.0.0",PORT ),Handler )as httpd :
    print (f"Serving http://127.0.0.1:{PORT } with COOP/COEP enabled.")
    try :
        import socket as _s
        _lan =_s .gethostbyname (_s .gethostname ())
        print (f"LAN (buka di HP satu WiFi): http://{_lan }:{PORT }")
    except Exception as e :
        print (e )
    httpd .serve_forever ()
