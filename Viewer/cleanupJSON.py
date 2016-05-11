import json

obj = json.load(file("PAL_porter_0.json"))
json.dump(obj, file("PAL_porter.json","w"), indent=4, sort_keys=True)

