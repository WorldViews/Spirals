import json

json.load(file("wtc0.json"))
str = file("trackTest0.json").read()
o = eval(str)
json.dump(o, file("trackTest.json", "w"), indent=4)

#json.loads(str)




