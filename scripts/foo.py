
import requests

url0 = "https://www.periscope.tv/w/ahc5ZDF6WUtiR1piZHJiamV8MXJtR1BFUGRiUFlKThmyhF1AUVT-wC2Gs671SD7Cb3oV2PyzjiEjuLKUD_py"
url1 = "https://www.periscope.tv/w/ahc5cDFYSmprQXJMRG5RTHl8MWpNSmdsb2pBRVl4TJMbdsmb9hfUpoYJKtdqRp_CTWkuiBy74_zk1iSIh26g"

def isPageAccessible(url):
    print "checkIfExists", url
    res = requests.head(url)
    print "status:", res.status_code
    return res.status_code == 200

def test():
    for url in [url0, url1]:
        isGood = isPageAccessible(url)
        print "isGood:", isGood

test()


