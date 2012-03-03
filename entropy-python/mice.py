# Parts of this script taken from test_manymouse_sdl.py
# http://code.google.com/p/pymanymouse/
#
import random
import pygame
single = False
try:
    import manymouse
except:
    print "ManyMouse not found, using single mouse instead"
    single = True

MAX_MICE = 128
MAX_BUTTONS = 3

available_mice = 0

class Mouse(object):
    def __init__(self, x,y, color, index=-1, name=None):
        self.connected = False
        self.index = index
        self.x = x
        self.y = y
        self.color = color
        self.name = name
        self.buttons = [False]*MAX_BUTTONS 
        
    def __str__(self):
        return "<mouse %s>" % (self.__dict__)
    __repr__ = __str__
        
        
mice = []

def update_mice_single():
    mouse = mice[0]
    mouse.buttons = pygame.mouse.get_pressed()
    target = pygame.mouse.get_pos()
    mouse.x = target[0]
    mouse.y = target[1]

def update_mice(screen_w, screen_h):
    global available_mice, mice
    event = manymouse.Event()
    while manymouse.poll_event(event) != 0:
        if event.device >= available_mice:
            continue
            
        mouse = mice[event.device]
        if event.type == manymouse.EVENT_RELMOTION:
            if event.item == 0:
                mouse.x += event.value
            elif event.item == 1:
                mouse.y += event.value
            if mouse.x > screen_w:
                mouse.x = screen_w
            elif mouse.x < 0:
                mouse.x = 0
            if mouse.y > screen_h:
                mouse.y = screen_h
            elif mouse.y < 0:
                mouse.y = 0
        elif event.type == manymouse.EVENT_ABSMOTION:
            val = event.value - event.minval
            maxval = event.maxval - event.minval
            if event.item == 0:
                mouse.x = (val/maxval)*screen_w
            elif event.item == 1:
                mouse.y = (val/maxval)*screen_h
                    
        elif event.type == manymouse.EVENT_BUTTON: 
            if event.item < MAX_BUTTONS: 
                if event.value:
                    mouse.buttons[event.item] = True
                else:
                    mouse.buttons[event.item] = False
            
        elif event.type == manymouse.EVENT_DISCONNECT:
            mice[event.device].connected = False
           
def init_mice_single():
    global available_mice, mice
    available_mice = 1
    mouse = Mouse(0, 0, (255,255,255))
    mouse.index = 0
    mouse.name = "Core Pointer"
    mouse.connected = True
    mice.append(mouse) 
 
def init_mice(screen_w, screen_h):
    global available_mice, mice
    available_mice = min(manymouse.init(), MAX_MICE)
    mice = []
    
    if available_mice == 0:
        print 'No mice detected!'
    else:
        for i in range(available_mice):
            name = manymouse.device_name(i)
            mouse = Mouse(screen_w/2, screen_h/2, tuple(random.randint(0,255) for x in range(3)))
            mouse.index = i
            mouse.name = name
            mouse.connected = True
            mice.append(mouse)            
            print '#%s: %s' % (i, mice[i].name)
            
            
screen_width = 0
screen_height = 0   
def init(width, height):
    global screen_width
    global screen_height
    screen_width = width
    screen_height = height
    if single:
        init_mice_single()
    else:
        init_mice(width, height)
    
def quit():
    if not single:
        manymouse.quit()
   
def update(width = screen_width, height = screen_height):
    if single:
        update_mice_single()
    else:
        update_mice(width, height)
    return mice

def get_mice():
    return mice
