#!/usr/bin/env python3
"""Añade interacciones curadas desde un fichero data/ext/ddi_*.json a app/data/ddi_curated.json (sin duplicar pares) y valida referencias.
Uso: python3 scripts/add_ddi.py data/ext/ddi_02_ampliacion.json"""
import json,sys
p='app/data/ddi_curated.json'; d=json.load(open(p,encoding='utf-8'))
nuevas=json.load(open(sys.argv[1],encoding='utf-8'))
exist={tuple(sorted((x['a'],x['b']))) for x in d['interacciones']}
added=0
for x in nuevas:
    k=tuple(sorted((x['a'],x['b'])))
    if k in exist: continue
    d['interacciones'].append(x); exist.add(k); added+=1
json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
kb=json.load(open('app/data/kb.json',encoding='utf-8'))
ids={pp['id'] for c in kb['clases'] for pp in c['principios']}; clases={c['id'] for c in kb['clases']}
bad=[(x['a'],x['b']) for x in d['interacciones'] for kk in (x['a'],x['b']) if (kk.startswith('clase:') and kk[6:] not in clases) or (not kk.startswith('clase:') and kk not in ids)]
print('añadidas',added,'total',len(d['interacciones']),'refs inválidas',bad)
