"""Construit le JSONL de la mutation groupée (productUpdate + media) pour les rendus validés
et le dépose sur la cible d'upload Shopify (STAGED = JSON {url, parameters})."""
import json, os, urllib.request, urllib.parse, uuid
src = open('jobs/source.txt').read().strip()
raw = urllib.request.urlopen(src, timeout=180).read().decode()
info = {}
for line in raw.splitlines():
    o = json.loads(line)
    if '__parentId' not in o:
        info[o['handle']] = (o['id'], o.get('title') or o['handle'].replace('-', ' ').capitalize())
acc = [h.strip() for h in open('qa/accepted.txt') if h.strip()]
lines, miss = [], []
for h in acc:
    if h not in info or not os.path.exists(f'out/{h}.jpg'):
        miss.append(h); continue
    pid, title = info[h]
    url = 'https://raw.githubusercontent.com/scalup5-sudo/lc-studio/main/out/' + urllib.parse.quote(h) + '.jpg'
    lines.append(json.dumps({'product': {'id': pid}, 'media': [{'originalSource': url, 'alt': f'{title} – Le Comptoir studio', 'mediaContentType': 'IMAGE'}]}, ensure_ascii=False))
body_file = '\n'.join(lines).encode()
print('lignes', len(lines), 'manquants', len(miss), miss[:20])
st = json.load(open("jobs/staged.json"))
b = uuid.uuid4().hex
parts = []
for p in st['parameters']:
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{p["name"]}"\r\n\r\n{p["value"]}\r\n'.encode())
parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="lc-studio-media.jsonl"\r\nContent-Type: text/jsonl\r\n\r\n'.encode() + body_file + f'\r\n--{b}--\r\n'.encode())
req = urllib.request.Request(st['url'], data=b''.join(parts), method='POST', headers={'Content-Type': f'multipart/form-data; boundary={b}'})
r = urllib.request.urlopen(req, timeout=180)
print('upload', r.status, r.read()[:300])
