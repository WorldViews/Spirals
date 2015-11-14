
import json, glob, os

def getNames(pattern):
    names = glob.glob(pattern)
    gnames = []
    for name in names:
        if name.startswith("old"):
            continue
        if name.startswith("comp"):
            continue
        if name.find("menu") >= 0:
            continue
        name = name.replace("\\", "/")
        name = name[:-len(".json")]
        gnames.append(name)
    gnames.sort()
    return gnames

def genMenu(menuPath="midiMenu.json"):
    names = getNames("*/*.json")+getNames("*.json")
    for name in names:
        print name
    json.dump(names, file(menuPath,"w"), indent=4)

if __name__ == '__main__':
    genMenu()
