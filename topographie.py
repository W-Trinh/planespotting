import json
import numpy as np
import matplotlib.pyplot as plt
import tkinter
import math


def hex_to_RGB(hex_str):
    """ #FFFFFF -> [255,255,255]"""
    #Pass 16 to the integer function for change of base
    return [int(hex_str[i:i+2], 16) for i in range(1,6,2)]

def get_color_gradient(c1, c2, n):
    """
    Given two hex colors, returns a color gradient
    with n colors.
    """
    assert n > 1
    c1_rgb = np.array(hex_to_RGB(c1))/255
    c2_rgb = np.array(hex_to_RGB(c2))/255
    mix_pcts = [x/(n-1) for x in range(n)]
    rgb_colors = [((1-mix)*c1_rgb + (mix*c2_rgb)) for mix in mix_pcts]
    return ["#" + "".join([format(int(round(val*255)), "02x") for val in item]) for item in rgb_colors]

gradient = get_color_gradient("#40FF33","#FF3333",101)
print(len(gradient))


with open('toulouse_elevation_data.json', 'r') as f:
  data = json.load(f)

points_matrix = []

points_array = []
points_array_normalized = []
lowest_point = 1000
highest_point = 0
heatmap_array = []

LAT_MIN = 43.463671
LAT_MAX = 43.774814
LON_MIN = 1.076765
LON_MAX = 1.632497

for row in data.values():
    tmp_row_elevations = []
    for x in row["points"]:
        tmp_row_elevations.append(x[2])
    heatmap_array.append(tmp_row_elevations)
    points_array += row["points"]

#for x in points_array:
    # points_array_normalized.append(
    #     [
    #         (x[0] - LAT_MIN) * 100,
    #         (x[1] - LON_MIN) * 100,
    #         x[2]
    #     ]
    # )

for x in points_array:
    if x[2] > highest_point:
        highest_point = x[2]
    if x[2] < lowest_point and x[2] >= 0:
        lowest_point = x[2]

#print(len(points_array), " points")

print("lowest : ", lowest_point)
print("highest : ", highest_point)



# top = tkinter.Tk()

# C = tkinter.Canvas(top, bg="white", height=3000, width=1000)

# for i, row in enumerate(heatmap_array):
#     for j, val in enumerate(row):
#         if val != 75:
#             continue
#         color = max( min( math.floor( ((val - 14) * 100) / (78 - 14) ), 100), 0)
#         C.create_rectangle(j, i, 1, 1, fill=gradient[color])

# C.pack()
# top.mainloop()

