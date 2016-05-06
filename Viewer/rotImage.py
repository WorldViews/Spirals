
from PIL import Image

def makeTrans(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = list()
    for item in datas:
        if item[0] == 0 and item[1] == 0 and item[2] == 255:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    #imgb.save("img2.png", "PNG")
    return img

def genRotImage(path, a, outPath=None):
    im = Image.open(path)
    w,h=im.size
    #im2 = Image.new(im.mode, (2*w,2*h), "black")
    im2 = Image.new(im.mode, (2*w,2*h))
    cbox = (w/2,h/2)
    im2.paste(im, cbox)
    im2 = im2.rotate(20)
    bbox = im2.getbbox()
    print bbox

    im2 = Image.new(im.mode, (2*w,2*h), "blue")
    im2.paste(im, cbox)
    im2 = im2.rotate(20)
    im = im2.crop(bbox)
    im = makeTrans(im)
    if outPath:
        im.save(outPath)
    im.show()


genRotImage("PorterFloorPlan.png", 25, "fxpalRot.png")


