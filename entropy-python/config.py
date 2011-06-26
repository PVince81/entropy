class Config:
    def __init__(self):
        self.screenSize = (1280,800)
        self.fullscreen = True
        self.fps = 24
        self.minRadius = 5
        self.maxRadius = 15
        self.gravity = (0.0, 0.2)
        self.gravityEnabled = True
        self.backgroundEnabled = True
        self.weightEnabled = True
        self.fpsEnabled = False
        self.fadeSpeed = 2
        self.ejection = 1.0
        self.friction = 1.01
        self.particleCount = 200
        self.colorFade = False
        #self.colorList = get_colors()
        self.colorList = None
        self.accelerometerEnabled = True
        self.boxMode = False
        self.videoOut = None
#        self.videoOut = "img%03d.png"

