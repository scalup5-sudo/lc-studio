import json, urllib.request
raw = urllib.request.urlopen(open('jobs/source.txt').read().strip(), timeout=180).read().decode()
keys=set(); rows={}
for line in raw.splitlines():
    o=json.loads(line)
    if '__parentId' in o: continue
    keys|=set(o.keys()); rows[o['handle']]=o
acc=[h.strip() for h in open('qa/accepted.txt') if h.strip()]
with open('jobs/map.tsv','w') as f:
    f.write('#keys '+','.join(sorted(keys))+'\n')
    for h in acc:
        o=rows.get(h)
        if not o: continue
        f.write('\t'.join([o['id'].split('/')[-1], h, str(o.get('status','')), (o.get('title') or '').replace('\t',' ')])+'\n')
