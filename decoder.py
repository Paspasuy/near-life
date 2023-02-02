WIDTH = 20
HEIGHT = 20

import base64

s = input()
b = base64.b64decode(s)

board = [['.' for i in range(WIDTH)] for j in range(HEIGHT)]
for i in range(len(b)):
	for t in range(8):
		val = (b[i] >> t) & 1
		ind = i * 8 + t
		y = ind // WIDTH
		x = ind % WIDTH
		board[y][x] = 'X' if val else '.'
for i in board:
	print(*i, sep='')
