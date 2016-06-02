
import json

obj = json.load(file("../Viewer/data/PAL_porter.json"))

json.dump(obj, file("PALmap.json","w"), indent=4, sort_keys=True)

