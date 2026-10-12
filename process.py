"""Traite une tranche du catalogue : pour chaque produit, essaie ses photos dans l'ordre
et garde la première qui passe le détourage studio. Usage : python process.py jobs/list.json SHARD NSHARDS"""
import json, sys, os, urllib.request, time
from studio import studio
k, n = int(sys.argv[2]), int(sys.argv[3])
def load(path):
    src = open(path).read().strip()
    if not src.startswith('http'):
        return json.loads(src)
    raw = urllib.request.urlopen(src, timeout=120).read().decode()
    prods, order = {}, []
    for line in raw.splitlines():
        o = json.loads(line)
        if '__parentId' in o:
            p = prods.get(o['__parentId'])
            if p is not None and o.get('image'):
                p['images'].append(o['image']['url']); p['w'].append(o['image'].get('width') or 0)
        else:
            prods[o['id']] = {'id': o['id'], 'handle': o['handle'], 'images': [], 'w': []}; order.append(o['id'])
    out = []
    for pid in order:
        p = prods[pid]
        if not p['images']: continue
        first = p['images'][0]
        if 'ai-premium' in first or 'lc-studio' in first or (p['w'] and p['w'][0] == 1264): continue
        out.append(p)
    return out
items = load(sys.argv[1])
os.makedirs('out', exist_ok=True); report = {}
for i, it in enumerate(items):
    if i % n != k: continue
    h = it['handle']; status = 'aucune photo exploitable'
    for u in it['images'][:4]:
        try:
            req = urllib.request.Request(u + ('&' if '?' in u else '?') + 'width=1600', headers={'User-Agent': 'lc-studio'})
            data = urllib.request.urlopen(req, timeout=60).read()
            out, msg = studio(data)
            if out:
                open(f'out/{h}.jpg', 'wb').write(out); status = 'ok'; break
            status = msg
        except Exception as e:
            status = f'erreur {e}'
    report[h] = status
    print(h, status, flush=True)
json.dump(report, open(f'out/report-{k}.json', 'w'), ensure_ascii=False, indent=0)
