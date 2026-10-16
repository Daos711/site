#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 daos711.ru contributors
"""Reconstruct at most ten explicitly selected locks from user-supplied observations.

No game matrices, original route arrays, network client, or bundled external
catalog are included. The caller supplies a local JSON array with fields:
id (initial positions concatenated, e.g. 2111), description, errors: [],
missingSecondButNotThird: false, and solutionUnskilled / solutionSkilled /
solutionMaster. Each solution is [{"plate": 1, "direction": "L", "count": 1}, ...].
Plate numbers are bottom-first; R decreases the numbered pin position.

Example:
  python scripts/reconstruct-gothic-observations.py --source observations.json \
    --ids 2111,712717 --output reconstructed.json

The enumeration tests every {-1,0,1} incoming coefficient for each output
plate against every prefix bound and final center. Adjacent skill models must
differ by exactly one nonzero directed coefficient removed globally. Dynamic
programming counts ALL consistent triples, including when materialization is
capped. More than one model must remain explicit: do not select one arbitrarily.
Independent BFS then searches a shortest route safe for every retained model.
An explicit state limit leaves a route unresolved rather than inventing a result.
This is a mathematical inference under the reported assumptions, not an in-game
verification. The source observations retain their authors' rights. Our derived
mathematical results are offered under CC0-1.0; that does not license source data.
"""
import argparse
from collections import deque
import functools
import hashlib
import itertools
import json
from pathlib import Path

def expanded(moves):return [(g['plate']-1,-1 if g['direction']=='R' else 1) for g in moves for _ in range(g['count'])]
def output_models(n,j,start,moves):
 result=[]
 for unknown in itertools.product([-1,0,1],repeat=n-1):
  coeff=list(unknown[:j])+[1]+list(unknown[j:]);state=start
  for p,d in moves:
   state+=coeff[p]*d
   if not 1<=state<=7:break
  else:
   if state==4:result.append(tuple(coeff))
 return result

def reductions(c,j):
 yield c,0,None
 for i,x in enumerate(c):
  if i!=j and x:
   reduced=list(c);reduced[i]=0;yield tuple(reduced),1,(i,j,x)

def solve(row,cap=10000):
 start=list(map(int,str(row['id'])));n=len(start);seq=[expanded(row[f]) for f in ['solutionUnskilled','solutionSkilled','solutionMaster']]
 if row['errors'] or row['missingSecondButNotThird'] or not all(seq):return {'id':row['id'],'excluded':'source warning/missing route'}
 if any(p<0 or p>=n for ss in seq for p,d in ss):return {'id':row['id'],'excluded':'plate outside initial fingerprint'}
 possibilities=[];stats=[]
 for j in range(n):
  levels=[output_models(n,j,start[j],ss) for ss in seq];lookup1=set(levels[1]);lookup2=set(levels[2]);triples=[]
  for a in levels[0]:
   for b,c1,e1 in reductions(a,j):
    if b not in lookup1:continue
    for c,c2,e2 in reductions(b,j):
     if c in lookup2:triples.append({'levels':[a,b,c],'d1':c1,'d2':c2,'e1':e1,'e2':e2})
  possibilities.append(triples);stats.append({'target':j,'noneCandidates':len(levels[0]),'trainedCandidates':len(levels[1]),'masterCandidates':len(levels[2]),'nestedTriples':len(triples)})
 @functools.lru_cache(None)
 def count(j,a,b):
  if a>1 or b>1:return 0
  if j==n:return int(a==b==1)
  return sum(count(j+1,a+t['d1'],b+t['d2']) for t in possibilities[j])
 total=count(0,0,0);models=[]
 def enumerate_models(j,a,b,path):
  if j==n:
   if a==b==1:
    configs=[]
    for level in range(3):
     links=[[0 if i==t else path[t]['levels'][level][i] for t in range(n)] for i in range(n)]
     configs.append({'positions':start,'links':links,'direction':'right-decreases'})
    models.append({'none':configs[0],'trained':configs[1],'master':configs[2],'removedAtTrained':[t['e1'] for t in path if t['e1']][0],'removedAtMaster':[t['e2'] for t in path if t['e2']][0]})
   return
  for t in possibilities[j]:
   aa=a+t['d1'];bb=b+t['d2']
   if count(j+1,aa,bb):enumerate_models(j+1,aa,bb,path+[t])
 if total<=cap:enumerate_models(0,0,0,[])
 assert total>cap or len(models)==total
 return {'id':row['id'],'description':row['description'],'sourceUrl':'https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s='+str(row['id']),'n':n,'modelCount':total,'fullyEnumerated':total<=cap,'columnCounts':stats,'models':models,'assumptions':['positions fingerprint is untouched initial state','plates bottom-first, right decreases numbered position','direct one-hop signed unit effects, no transitive cascading','all prefix states within1..7, target4','trained removes exactly one edge, master one more edge, unknown order exhaustively searched','all three source routes apply to the same lock and game build']}

def apply_move(configs, state, plate, direction):
    """Apply one atomic press in every possible model; reject any violated bound."""
    n = len(configs[0]["positions"])
    result = list(state)
    for model_index, config in enumerate(configs):
        offset = model_index * n
        for target in range(n):
            effect = 1 if target == plate else config["links"][plate][target]
            value = state[offset + target] + effect * direction
            if not 1 <= value <= 7:
                return None
            result[offset + target] = value
    return tuple(result)


def replay(configs, moves):
    state = tuple(position for config in configs for position in config["positions"])
    for move in moves:
        state = apply_move(configs, state, move["plate"], move["direction"])
        if state is None:
            return False
    return all(position == 4 for position in state)


def breadth_first_route(configs, max_states):
    """Search joint physical states, never choose a preferred ambiguous graph."""
    n = len(configs[0]["positions"])
    start = tuple(position for config in configs for position in config["positions"])
    target = (4,) * len(start)
    pending = deque([start])
    previous = {start: None}
    while pending:
        state = pending.popleft()
        if state == target:
            moves = []
            while previous[state] is not None:
                state, plate, direction = previous[state]
                moves.append({"plate": plate, "direction": direction})
            moves.reverse()
            return {"status": "solved", "moves": moves, "visited": len(previous)}
        for plate in range(n):
            for direction in (-1, 1):
                successor = apply_move(configs, state, plate, direction)
                if successor is None or successor in previous:
                    continue
                if len(previous) >= max_states:
                    return {"status": "state-limit", "visited": len(previous)}
                previous[successor] = (state, plate, direction)
                pending.append(successor)
    return {"status": "unreachable", "visited": len(previous)}


def derive_routes(result, max_states):
    """Calculate own routes; original observed routes never enter the output."""
    if not result.get("fullyEnumerated") or not result.get("models"):
        return {"status": "models-not-fully-enumerated"}
    routes = {}
    for skill in ("none", "trained", "master"):
        configs = []
        seen = set()
        for model in result["models"]:
            config = model[skill]
            signature = json.dumps(config, sort_keys=True, separators=(",", ":"))
            if signature not in seen:
                seen.add(signature)
                configs.append(config)
        route = None
        # A shortest route in one model is globally shortest if it also solves
        # all the other models. This fast path cannot discard any alternative.
        for config in configs:
            candidate = breadth_first_route([config], max_states)
            if candidate["status"] == "solved" and replay(configs, candidate["moves"]):
                route = candidate
                route["search"] = "single-model shortest route, replayed in every model"
                break
        if route is None:
            route = breadth_first_route(configs, max_states)
            route["search"] = "joint-state breadth-first search"
        route["distinctModels"] = len(configs)
        if route["status"] == "solved":
            assert replay(configs, route["moves"])
            route["validInEveryModel"] = True
        routes[skill] = route
    return routes


def validate_observation(row):
    identifier = str(row.get("id", ""))
    if not 4 <= len(identifier) <= 7 or any(c not in "1234567" for c in identifier):
        raise ValueError("Initial fingerprint must contain 4–7 positions in 1–7")
    if row.get("errors") or row.get("missingSecondButNotThird"):
        raise ValueError("Flagged source observations are not eligible for reconstruction")
    for field in ("solutionUnskilled", "solutionSkilled", "solutionMaster"):
        moves = row.get(field)
        if not isinstance(moves, list) or not moves:
            raise ValueError("All three skill routes are required")
        clicks = 0
        for move in moves:
            if (type(move.get("plate")) is not int or not 1 <= move["plate"] <= len(identifier)
                or move.get("direction") not in ("L", "R")
                or type(move.get("count")) is not int or not 1 <= move["count"] <= 100):
                raise ValueError("Invalid atomic move group")
            clicks += move["count"]
        if clicks > 5000:
            raise ValueError("Route exceeds the bounded input limit")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--ids", required=True, help="Explicit comma-separated initial fingerprints, at most ten")
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-models", type=int, default=10000)
    parser.add_argument("--max-states", type=int, default=500000, help="BFS state bound per search")
    args = parser.parse_args()
    ids = list(dict.fromkeys(int(v.strip()) for v in args.ids.split(",")))
    if not 1 <= len(ids) <= 10 or not 1 <= args.max_models <= 10000:
        parser.error("Select 1–10 observations and a model limit in 1–10000")
    if not 1 <= args.max_states <= 5000000:
        parser.error("BFS state limit must be in 1–5000000")
    rows = json.loads(args.source.read_text(encoding="utf-8-sig"))
    if not isinstance(rows, list):
        parser.error("Input must be a JSON array")
    results = []
    for identifier in ids:
        matches = [r for r in rows if r.get("id") == identifier]
        if len(matches) != 1:
            parser.error(f"Fingerprint {identifier}: expected one explicitly identified observation, got {len(matches)}")
        row = matches[0]
        validate_observation(row)
        result = solve(row, args.max_models)
        result["ownRoutes"] = derive_routes(result, args.max_states)
        result["observationHashes"] = {
            field: hashlib.sha256(json.dumps(row[field], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
            for field in ("solutionUnskilled", "solutionSkilled", "solutionMaster")
        }
        results.append(result)
    payload = {"method": "exhaustive signed direct-effect reconstruction with nested skill deletions",
               "license": "CC0-1.0 (our mathematical results only)",
               "sourceDataIncluded": False, "results": results}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"observations": len(results), "modelCounts": {str(r["id"]): r["modelCount"] for r in results}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
