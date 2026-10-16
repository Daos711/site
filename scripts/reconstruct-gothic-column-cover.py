#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 daos711.ru contributors
"""Infer direct signed lock effects and complete column-witness covers.

No game arrays, external guide routes, or networking are included. Inputs are
explicit local observations. A record has `id`, `positions` (2–7 integers in
1..7), and `routes`: each of none/trained/master is a non-empty list of atomic
move arrays. A move is {"plate": 0-based bottom-first index, "direction": -1|1}.
Direction is the change in numbered position; in the site's physical convention
right decreases that position. Multiple routes per skill are intersected.

Assumptions: direct one-hop signed unit effects; self effect +1; bounds 1..7;
goal all 4; trained removes exactly one nonzero off-diagonal edge, master one
more. This proves conditional mathematical compatibility, not game testing.

Each output plate depends only on one incoming column. Feasible complete models
witnessing every feasible column therefore accept precisely the same sequences
as all feasible models together, including every intermediate bound and goal.
The result counts unique full matrices separately for each skill; full triples
are counted separately. No arbitrary candidate is selected as the real lock.

Example (observations supplied separately):
  python scripts/reconstruct-gothic-column-cover.py --source observations.json \
    --ids south-shack --output cover.json

Our generated mathematical results are CC0-1.0. Source observations retain their
own licenses. The MIT license of this script grants no rights to external data.
"""
import argparse
import functools
import itertools
import json
from pathlib import Path

SKILLS = ("none", "trained", "master")


def output_models(n, target, initial, moves):
    result = []
    for unknown in itertools.product((-1, 0, 1), repeat=n - 1):
        coefficients = unknown[:target] + (1,) + unknown[target:]
        value = initial
        for plate, direction in moves:
            value += coefficients[plate] * direction
            if not 1 <= value <= 7:
                break
        else:
            if value == 4:
                result.append(coefficients)
    return result


def reductions(column, target):
    yield column, 0
    for source, coefficient in enumerate(column):
        if source != target and coefficient:
            reduced = list(column)
            reduced[source] = 0
            yield tuple(reduced), 1


def replay(config, moves):
    state = list(config["positions"])
    for move in moves:
        source, direction = move["plate"], move["direction"]
        state = [value + direction * (1 if target == source else config["links"][source][target])
                 for target, value in enumerate(state)]
        if any(value < 1 or value > 7 for value in state):
            return False
    return all(value == 4 for value in state)


def validate_observation(observation):
    positions = observation.get("positions")
    if not isinstance(positions, list) or not 2 <= len(positions) <= 7:
        raise ValueError("Expected 2–7 initial plate positions")
    if any(type(value) is not int or not 1 <= value <= 7 for value in positions):
        raise ValueError("Every initial position must be an integer in 1–7")
    routes = observation.get("routes", {})
    for skill in SKILLS:
        observations = routes.get(skill)
        if not isinstance(observations, list) or not 1 <= len(observations) <= 10:
            raise ValueError("Each skill requires 1–10 independently supplied routes")
        for route in observations:
            if not isinstance(route, list) or not 1 <= len(route) <= 5000:
                raise ValueError("Every route requires 1–5000 atomic moves")
            for move in route:
                if not isinstance(move, dict) or type(move.get("plate")) is not int or not 0 <= move["plate"] < len(positions):
                    raise ValueError("Move plate must be a zero-based in-range integer")
                if type(move.get("direction")) is not int or move["direction"] not in (-1, 1):
                    raise ValueError("Move direction must be -1 or +1")


def columns(config):
    n = len(config["positions"])
    return [(j, tuple(1 if i == j else config["links"][i][j] for i in range(n))) for j in range(n)]


def construct_configs(start, path):
    n = len(start)
    return [{"positions": start, "direction": "right-decreases", "links":
             [[0 if i == j else path[j][0][level][i] for j in range(n)] for i in range(n)]}
            for level in range(3)]


def infer_observation(observation):
    """Return exact graph counts and feasible column-witness covers for 3 skills."""
    validate_observation(observation)
    start = list(observation["positions"])
    n = len(start)
    routes = [observation["routes"][skill] for skill in SKILLS]
    choices = []
    for j in range(n):
        level_columns = []
        for observations in routes:
            candidates = None
            for route in observations:
                moves = [(m["plate"], m["direction"]) for m in route]
                current = set(output_models(n, j, start[j], moves))
                candidates = current if candidates is None else candidates & current
            level_columns.append(candidates)
        triples = []
        for a in sorted(level_columns[0]):
            for b, d1 in reductions(a, j):
                if b not in level_columns[1]:
                    continue
                for c, d2 in reductions(b, j):
                    if c in level_columns[2]:
                        triples.append(((a, b, c), d1, d2))
        choices.append(triples)

    @functools.lru_cache(None)
    def count(j, used1, used2):
        if used1 > 1 or used2 > 1:
            return 0
        if j == n:
            return int(used1 == used2 == 1)
        return sum(count(j + 1, used1 + t[1], used2 + t[2]) for t in choices[j])

    total = count(0, 0, 0)
    if not total:
        return {"modelCount": 0, "profiles": {}}
    prefixes = [{(0, 0): []}]
    for j in range(n):
        next_prefixes = {}
        for (a, b), path in prefixes[-1].items():
            for t in choices[j]:
                aa, bb = a + t[1], b + t[2]
                if aa <= 1 and bb <= 1:
                    next_prefixes.setdefault((aa, bb), path + [t])
        prefixes.append(next_prefixes)

    def suffix(j, a, b):
        if j == n:
            assert a == b == 1
            return []
        for t in choices[j]:
            if count(j + 1, a + t[1], b + t[2]):
                return [t] + suffix(j + 1, a + t[1], b + t[2])
        raise AssertionError("A counted completion must exist")

    feasible = [set(), set(), set()]
    witnesses = [dict(), dict(), dict()]
    for j, triples in enumerate(choices):
        for t in triples:
            for (a, b), prefix in prefixes[j].items():
                aa, bb = a + t[1], b + t[2]
                if not count(j + 1, aa, bb):
                    continue
                wanted = [(level, (j, t[0][level])) for level in range(3)]
                if all(pair in feasible[level] for level, pair in wanted):
                    break
                path = prefix + [t] + suffix(j + 1, aa, bb)
                configs = construct_configs(start, path)
                # Every witness is itself a complete legal triple, not an
                # artificial assembly of mutually incompatible columns.
                for level, config in enumerate(configs):
                    for route in routes[level]:
                        assert replay(config, route)
                for level, config in enumerate(configs):
                    feasible[level].update(columns(config))
                    witnesses[level][json.dumps(config, sort_keys=True)] = config
                break

    def distinct_graph_count(level):
        # Determinize the possible global deletion counters. Distinct sequences
        # of selected columns represent distinct full matrices, even when many
        # none/trained/master triples share the same selected-skill matrix.
        states = {frozenset({(0, 0)}): 1}
        for triples in choices:
            by_column = {}
            for t in triples:
                by_column.setdefault(t[0][level], set()).add((t[1], t[2]))
            following = {}
            for possible_counters, prefix_count in states.items():
                for increments in by_column.values():
                    reached = frozenset((a + x, b + y) for a, b in possible_counters
                                        for x, y in increments if a + x <= 1 and b + y <= 1)
                    if reached:
                        following[reached] = following.get(reached, 0) + prefix_count
            states = following
        return sum(amount for counters, amount in states.items() if (1, 1) in counters)

    profiles = {}
    for level, skill in enumerate(("none", "trained", "master")):
        universe = feasible[level]
        remaining = set(universe)
        available = [(config, set(columns(config))) for config in witnesses[level].values()]
        cover = []
        while remaining:
            config, covered = max(available, key=lambda item: len(item[1] & remaining))
            assert covered & remaining
            cover.append(config)
            remaining -= covered
            available = [(c, v) for c, v in available if c is not config]
        actual = set(pair for config in cover for pair in columns(config))
        assert actual == universe
        profiles[skill] = {"configs": cover, "proof": {
            "method": "complete feasible incoming-column coverage",
            "fullTripleCount": total,
            "distinctSkillModels": distinct_graph_count(level),
            "columnPossibilities": [[list(vector) for target, vector in sorted(universe) if target == j] for j in range(n)],
            "witnessCount": len(cover),
            "witnessesAreFeasible": True,
            "coverageExact": actual == universe
        }}
    return {"modelCount": total, "profiles": profiles}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--ids", required=True, help="Explicit comma-separated observation IDs")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    records = json.loads(args.source.read_text(encoding="utf-8-sig"))
    if not isinstance(records, list):
        parser.error("Source must contain an array of observations")
    selected = list(dict.fromkeys(value.strip() for value in args.ids.split(",") if value.strip()))
    if not selected:
        parser.error("At least one explicit ID is required")
    results = []
    for identifier in selected:
        matches = [r for r in records if str(r.get("id")) == identifier]
        if len(matches) != 1:
            parser.error(f"Expected one observation for ID {identifier}, found {len(matches)}")
        result = infer_observation(matches[0])
        result["id"] = identifier
        results.append(result)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"license": "CC0-1.0 (generated results only)", "sourceDataIncluded": False, "results": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"observations": len(results), "fullTripleCounts": {r["id"]: r["modelCount"] for r in results}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
