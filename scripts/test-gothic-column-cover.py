#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 daos711.ru contributors
"""Independent exhaustive synthetic checks of column-cover reconstruction.

Uses a separate physical simulator, graph enumerator and breadth-first search.
No game arrays, source guide routes, absolute paths or network access.
"""
import collections, importlib.util, itertools, json, pathlib, random, sys
sys.dont_write_bytecode=True
module_path=pathlib.Path(__file__).with_name('reconstruct-gothic-column-cover.py')
spec=importlib.util.spec_from_file_location('column_cover_under_test',module_path)
cover_module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(cover_module)

def press(graph,state,plate,d):
    out=tuple(v+d*(1 if j==plate else graph[plate][j]) for j,v in enumerate(state))
    return out if all(1<=v<=7 for v in out) else None

def accepts(graph,start,moves):
    state=tuple(start)
    for m in moves:
        state=press(graph,state,m['plate'],m['direction'])
        if state is None:return False
    return state==(4,)*len(start)

def solve(graph,start):
    start=tuple(start);q=collections.deque([start]);prev={start:None};n=len(start)
    while q:
        state=q.popleft()
        if state==(4,)*n:
            route=[]
            while prev[state] is not None:
                old,p,d=prev[state];route.append({'plate':p,'direction':d});state=old
            return route[::-1]
        for p in range(n):
            for d in (-1,1):
                nxt=press(graph,state,p,d)
                if nxt is not None and nxt not in prev:prev[nxt]=(state,p,d);q.append(nxt)
    raise AssertionError('Synthetic graph should be solvable')

def groups(moves):return [{'plate':m['plate']+1,'direction':'R' if m['direction']==-1 else 'L','count':1} for m in moves]
def key(graph):return tuple(tuple(row) for row in graph)
def reduced(graph,e):
    out=[list(r) for r in graph];out[e[0]][e[1]]=0;return key(out)
def cols(graph):return {(j,tuple(1 if i==j else graph[i][j] for i in range(len(graph)))) for j in range(len(graph))}

cases=[([3,3,5],((0,1,0),(0,0,-1),(0,0,0)),((0,1),(1,2))),([2,5,3],((0,-1,1),(0,0,0),(0,1,0)),((2,1),(0,2))),([5,2,6],((0,0,-1),(1,0,0),(0,0,0)),((1,0),(0,2)))]
cases.append(([4,4,4],((0,1,0),(0,0,-1),(0,0,0)),((0,1),(1,2))))
results=[];rng=random.Random(711)
for index,(start,base,edges) in enumerate(cases):
    n=len(start);graphs=[base,reduced(base,edges[0])];graphs.append(reduced(graphs[1],edges[1]));routes=[solve(g,start) for g in graphs]
    if start==[4,4,4]:routes=[[{'plate':0,'direction':1},{'plate':0,'direction':-1}] for _ in range(3)]
    observation={'id':f'synthetic-{index+1}','positions':start,'routes':{skill:[routes[level]] for level,skill in enumerate(('none','trained','master'))}}
    result=cover_module.infer_observation(observation)
    pairs=[(i,j) for i in range(n) for j in range(n) if i!=j]
    full=[]
    for values in itertools.product((-1,0,1),repeat=len(pairs)):
        candidate=[[0]*n for _ in range(n)]
        for (i,j),v in zip(pairs,values):candidate[i][j]=v
        a=key(candidate)
        if not accepts(a,start,routes[0]):continue
        active=[e for e in pairs if a[e[0]][e[1]]]
        for first in active:
            b=reduced(a,first)
            if not accepts(b,start,routes[1]):continue
            for second in active:
                if second==first:continue
                c=reduced(b,second)
                if accepts(c,start,routes[2]):full.append((a,b,c))
    assert result['modelCount']==len(full),(index,result['modelCount'],len(full))
    levels=[]
    for lev,skill in enumerate(('none','trained','master')):
        exact={t[lev] for t in full};profile=result['profiles'][skill]
        cover={key(c['links']) for c in profile['configs']}
        assert cover<=exact
        exact_cols=set().union(*(cols(g) for g in exact));cover_cols=set().union(*(cols(g) for g in cover))
        assert exact_cols==cover_cols
        assert profile['proof']['distinctSkillModels']==len(exact),(index,skill,profile['proof']['distinctSkillModels'],len(exact))
        for trial in range(1003):
            moves=routes[trial] if trial<3 else [{'plate':rng.randrange(n),'direction':rng.choice((-1,1))} for _ in range(rng.randrange(15))]
            assert all(accepts(g,start,moves) for g in cover)==all(accepts(g,start,moves) for g in exact)
        levels.append({'skill':skill,'distinctModels':len(exact),'coverWitnesses':len(cover),'columnCoverageExact':True,'routeAcceptanceChecks':1003})
    results.append({'syntheticCase':index+1,'fullTriples':len(full),'levels':levels})
report={'result':'PASS','externalObservationsRead':False,'productionModified':False,'assumptions':'Direct linear atomic effects, identical initial state, independently bounded output plates, and exactly one edge deleted at each skill transition. This does not independently establish those gameplay assumptions.','cases':results}
print(json.dumps(report))
