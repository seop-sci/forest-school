import re, json
s=open('/home/claude/work/forest-school/dev/forest-school.html',encoding='utf-8').read()
blocks=[(m.start(), m.group(1)) for m in re.finditer(r'window\.(FS_IMG\w*)\s*=', s)]
idx={}
for m in re.finditer(r'["\']([A-Za-z0-9_]+)["\']\s*:\s*["\']data:image', s):
    name=[b for p,b in blocks if p<m.start()]
    idx.setdefault(m.group(1),[]).append(name[-1] if name else '?')
json.dump(idx,open('/home/claude/gen/imgindex.json','w'))
print(len(idx), sorted(set(b for _,b in blocks)))
