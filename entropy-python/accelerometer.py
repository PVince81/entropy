import dbus

class Accelerometer:
    def __init__(self):
        self.rotation = (0.0, 0.0, 0.0);
        bus = dbus.SystemBus()             
        self.__accel = bus.get_object('com.nokia.mce',
            '/com/nokia/mce/request',
            'com.nokia.mce.request') 

    def getRotation(self):
        orientation , stand , face , x , y , z = self.__accel.get_device_orientation()
        self.rotation = (x / 1000.0, y / 1000.0, z / 1000.0)
        return self.rotation 


if __name__ == "__main__":
    import time
    accel = Accelerometer()

    while True:
        print accel.getRotation()
        time.sleep(0.5)



