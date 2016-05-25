
from PIL import Image

def makeTrans(inputPath, outputPath, size=None):
    img = Image.open(inputPath)
    img = img.convert("RGBA")

    datas = img.getdata()

    newData = []
    for item in datas:
        if item[0] == 255 and item[1] == 255 and item[2] == 255:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    if size:
        print "resizing to", size
        img = img.resize(size)
    img.save(outputPath, "PNG")


if __name__ == '__main__':
#    makeTrans("../Viewer/temple.png", "../Viewer/temple_trans.png")
#    makeTrans("../Viewer/jumpChat0.png", "../Viewer/jumpChat.png")
#    makeTrans("../Viewer/images/drone0.png",
#              "../Viewer/images/drone.png", (200,200))
    makeTrans("../Viewer/images/redQmark.png",
              "../Viewer/images/redQmark.png")


