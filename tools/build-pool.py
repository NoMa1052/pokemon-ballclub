#!/usr/bin/env python3
"""Rebuild card-pool rows from PokeAPI CSVs (github.com/PokeAPI/pokeapi, data/v2/csv).
Usage: build-pool.py <csv dir> <first id> <last id>   -> prints RAW rows and evolution parents as JSON."""
import csv, json, sys
d,lo,hi=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
R=lambda f:list(csv.DictReader(open(f'{d}/{f}.csv',encoding='utf-8')))
species={int(r['id']):r for r in R('pokemon_species')}
mon={int(r['species_id']):r for r in R('pokemon') if r['is_default']=='1'}
names={int(r['pokemon_species_id']):r['name'] for r in R('pokemon_species_names') if r['local_language_id']=='9'}
tname={int(r['id']):r['identifier'] for r in R('types')}
STAT={1:'hp',2:'atk',3:'def',4:'spa',5:'spd',6:'spe'}
stats={};types={}
pid2sp={int(r['id']):int(r['species_id']) for r in R('pokemon') if r['is_default']=='1'}
for r in R('pokemon_stats'):
    sp=pid2sp.get(int(r['pokemon_id']))
    if sp and int(r['stat_id']) in STAT: stats.setdefault(sp,{})[STAT[int(r['stat_id'])]]=int(r['base_stat'])
for r in R('pokemon_types'):
    sp=pid2sp.get(int(r['pokemon_id']))
    if sp: types.setdefault(sp,{})[int(r['slot'])]=tname[int(r['type_id'])]
rows=[];parents={}
for i in range(lo,hi+1):
    s,m,st=species[i],mon[i],stats[i]
    t='/'.join(types[i][k] for k in sorted(types[i]))
    leg=1 if s['is_legendary']=='1' or s['is_mythical']=='1' else 0
    rows.append([i,names[i],int(s['generation_id']),t,st['hp'],st['atk'],st['def'],st['spa'],st['spd'],st['spe'],int(s['shape_id'] or 12),int(m['height']),int(m['weight']),leg])
    if s['evolves_from_species_id']: parents[str(i)]=int(s['evolves_from_species_id'])
print(json.dumps({'rows':rows,'parents':parents},ensure_ascii=False))
