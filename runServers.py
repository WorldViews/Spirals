
import PhysVizServer as PVS
import WebSockets.PWSServer as PWS

PWS.runInThread(8100)
PVS.run(8000)
