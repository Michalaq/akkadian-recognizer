import os
import sys
import subprocess

with open(sys.argv[1], 'r') as f:
    lines = f.readlines()

lines = list(map(lambda x: x.replace('\x00', '').strip().split(' ')[0], lines))

files = sorted(os.listdir(sys.argv[2]))

ret = list(zip(lines, files))

for l, f in ret:
    subprocess.call(['cp', sys.argv[2] + f, l.replace('/', '_')+'.png'])

