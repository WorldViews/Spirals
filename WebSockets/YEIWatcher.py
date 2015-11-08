
import time, math, traceback
import threespace_api as ts_api

def watchAngles_(angleCallback=None, maxTime=None):
    t0 = time.time()
    #device_list = ts_api.getComPorts(filter=ts_api.TSS_FIND_USB)
    device_list = ts_api.getComPorts()

    print "device_list:", device_list
    com_port = device_list[0]
    device = ts_api.TSBTSensor(com_port=com_port)

    ## If a connection to the COM port fails, None is returned.
    if not device:
        print "Cannot get device"
        return

    ## The class instances have all of the functionality that corresponds to the
    ## 3-Space Sensor device type it is representing.
    print("==================================================")
    print("Getting the filtered tared quaternion orientation.")
    quat = device.getTaredOrientationAsQuaternion()
    if quat is not None:
        print(quat)
    print("==================================================")
    print("Getting the raw sensor data.")
    data = device.getAllRawComponentSensorData()
    gyro = data[:3]
    print "gyro:", gyro
    if data is not None:
        print data
        print("[%f, %f, %f] --Gyro\n"
              "[%f, %f, %f] --Accel\n"
              "[%f, %f, %f] --Comp" % data)

    i = 0
    while 1:
        i += 1
        t = time.time()
        dt = t - t0
        if maxTime and dt > maxTime:
            break
        angles = device.getTaredOrientationAsEulerAngles()
        #print i, angles
        angles = map(math.degrees, angles)
        pitch, roll, yaw = angles
        print "%4d %7.1f %7.1f %7.1f" % (i, yaw, pitch, roll)
        if angleCallback != None:
            angleCallback(angles)

    ## Now close the port.
    device.close()

def watchAngles(angleCallback=None, maxTime=None):
    while 1:
        try:
            watchAngles_(angleCallback, maxTime)
        except:
            traceback.print_exc()
        print "Wait a second and try again"
        time.sleep(1)

if __name__ == '__main__':
   watchAngles()




