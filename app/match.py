import json
from copy import copy
from glob import glob
import math

WRONG_TYPE_PENALTY = 0.5
MISSING_MATCH_PENALTY = 1.0
N_NEIGHBORS = 1

def norm(fts):
    x_min = float('+inf')
    x_max = float('-inf')
    y_min = float('+inf')
    y_max = float('-inf')
    for (t, x, y) in fts:
        x_min = min(x, x_min)
        x_max = max(x, x_max)
        y_min = min(y, y_min)
        y_max = max(y, y_max)
    z = 1.0 / (y_max - y_min + 1)
    return [(t, (x - x_min) * z, (y - y_min) * z) for (t, x, y) in fts]

def dist(p1, p2):
    (t1, x1, y1) = p1
    (t2, x2, y2) = p2
    return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5 + int(t1 != t2) * WRONG_TYPE_PENALTY

def turbo_matching(fts1, fts2):
    fts1 = list(fts1)
    fts2 = list(fts2)
    if len(fts1) > len(fts2):
        return turbo_matching(fts2, fts1)
    
    fts1 = norm(fts1)
    fts2 = norm(fts2)
    dists = [[dist(ft1, ft2) for ft2 in fts2] for ft1 in fts1]
    neighbors1 = [sorted(range(len(fts2)), key=lambda j: dists[i][j])[: N_NEIGHBORS] for i in range(len(fts1))]
    
    def get_conflict(match):
        if not match or match[-1] == -1:
            return None
        conflicts = [i for i in range(len(match) - 1) if match[i] == match[-1]]
        if len(conflicts) > 0:
            return conflicts[0]
        else:
            return None
    
    def get_score(match):
        missing2 = len(fts2) - len(list(filter(lambda x: x != -1, match)))
        return sum(dists[i][j] if match[i] != -1 else MISSING_MATCH_PENALTY for (i, j) in enumerate(match)) + missing2 * MISSING_MATCH_PENALTY
    
    def gen_matches(match_prefix=[]):
        conflict = get_conflict(match_prefix)
        if conflict:
            match_prefix_copy = copy(match_prefix)
            match_prefix_copy[conflict] = -1
            for match in gen_matches(match_prefix_copy):
                yield match
        elif len(match_prefix) == len(fts1):
            yield match_prefix
        else:
            for neighbor in neighbors1[len(match_prefix)]:
                for match in gen_matches(match_prefix + [neighbor]):
                    yield match
                
    best_score = float('+inf')
    for match in gen_matches():
        score = get_score(match)
        if score < best_score:
            #print 'new best score:', score, 'for', match
            best_score = score
    
    return best_score

_paths = glob('pics/*.json')

def stroke_to_ft(stroke):
    ((x1, y1), (x2, y2)) = stroke
    if x1 == x2 and y1 == y2:
        return ('h', x1, y1)
    else:
        dx = x2 - x1
        dy = y2 - y1
        angle = math.atan2(dy, dx) * 180 / math.pi
        das = [abs(angle - a) for a in [-90, -45, 0, 45, 90]]
        dirs = ['d', 'u', 'r', 'd', 'u']
        dir = dirs[sorted(range(len(dirs)), key=lambda i: das[i])[0]]
        return (dir, x1, y1)

def search(strokes, k):
    fts1 = list(map(stroke_to_ft, strokes))

    best_path = None
    best_score = float('+inf')
    scores = []
    for match_path in _paths:
        with open(match_path, 'r') as f:
            fts2 = json.loads(f.read())
        scores.append(turbo_matching(fts1, fts2))
    paths = ['.'.join(path.split('/')[-1].split('.')[: -1]) for path in _paths]
    paths_and_scores = list(zip(paths, scores))
    return list(zip(*list(sorted(paths_and_scores, key=lambda s: s[1]))[: k]))[0]
