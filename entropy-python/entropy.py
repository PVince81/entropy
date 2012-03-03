#!/usr/bin/python
#
#  Entropy
#
#  By Vincent Petry - PVince81 at yahoo dot fr
#
# ---------------------------------------------------------------------------
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.*
#

import pygame, sys,os
import random
import math
from config import Config
from pygame.locals import *
from pygame import Surface
import mice

class Pixel:
    def __init__(self, x, y, color, radius = 1):
        self.color = color
        self.currentcolor = list(color)
        self.originalcolor = color
        self.colorChange = 0.0
        self.x = x
        self.y = y
        self.vx = random.random() * 2.0 - 1.0
        self.vy = random.random() * 2.0 - 1.0
        self.radius = radius
        self.weight = self.radius / 10.0


def initDisplay():
    global screen
    flags = 0
    if config.fullscreen:
        flags = pygame.FULLSCREEN | pygame.HWSURFACE | pygame.DOUBLEBUF

    pygame.display.set_mode(config.screenSize, flags)
    pygame.display.set_caption('Entropy') 
    screen = pygame.display.get_surface()


def input(events): 
    global config
    global terminated
    global gravity
    global action

    # Update gravity using accelerometer data
    if config.accelerometerEnabled:
        accel = accelerometer.getRotation()
        gravity = ( -accel[0], -accel[1] )

    # Update action and target using mouse position and buttons
    for mouse in mice.get_mice():
        mods = pygame.key.get_mods()
        action[mouse.index] = 0
        if mouse.buttons[0]:
            action[mouse.index] = 1
        if mouse.buttons[1] or (mouse.buttons[0] and mods & KMOD_CTRL):
            action[mouse.index] = 3
        if mouse.buttons[2] or (mouse.buttons[0] and mods & KMOD_SHIFT):
            action[mouse.index] = 2

    # Process events
    for event in events: 
        if event.type == QUIT: 
            terminated = True
        elif event.type == KEYUP:
            if event.key == K_ESCAPE or event.key == K_q:
                terminated = True
            elif event.key == K_RETURN:
                if mods & KMOD_ALT:
                    config.fullscreen = not config.fullscreen
                    initDisplay()
                    if config.fullscreen:
                        setMessage("Fullscreen mode")
                    else:
                        setMessage("Windowed mode")
            elif event.key == K_b:
                config.boxMode = not config.boxMode
                if config.boxMode:
                    setMessage("Box mode")
                else:
                    setMessage("Circle mode")
            elif event.key == K_g:
                config.gravityEnabled = not config.gravityEnabled
                if config.gravityEnabled:
                    setMessage("Gravity enabled")
                else:
                    setMessage("Gravity disabled")
            elif event.key == K_w:
                config.weightEnabled = not config.weightEnabled
                if config.weightEnabled:
                    setMessage("Weight enabled")
                else:
                    setMessage("Weight disabled")
            elif event.key == K_c:
                config.colorFade = not config.colorFade
                if config.colorFade:
                    setMessage("Color fade enabled")
                else:
                    setMessage("Color fade disabled")
            elif event.key == K_f:
                config.fpsEnabled = not config.fpsEnabled
            elif event.key == K_UP:
                if mods & KMOD_SHIFT:
                    amount = 10
                else:
                    amount = 100
                setNumParticles(config.particleCount + amount)
                setMessage("%d particles" % config.particleCount)
            elif event.key == K_DOWN:
                if mods & KMOD_SHIFT:
                    amount = 10
                else:
                    amount = 100
                setNumParticles(config.particleCount - amount)
                setMessage("%d particles" % config.particleCount)
            elif event.key == K_h:
                setMessage(helpMessage) 


def process():
    for x in range(maxX):
        for y in range(maxY):
            value = pxarray[x][y]
            if  value > 0:
                color = screen.unmap_rgb( value )
                color.r = int(color.r / fadeSpeed)
                color.g = int(color.g / fadeSpeed)
                color.b = int(color.b / fadeSpeed)
                pxarray[x][y] = screen.map_rgb(color)

def render():
    global pxarray
    #process();
    if config.backgroundEnabled:
        screen.fill(bkg_color)

    #screen.blit(player_surface,(px,py))
    if config.boxMode:
        for pixel in pixels:
#       if pixel.radius <= 1:
#            pxarray[int(pixel.x)][int(pixel.y)] = pixel.color
#       else:
            x = int(pixel.x - pixel.radius)
            y = int(pixel.y - pixel.radius)
            d = pixel.radius * 2
            pygame.draw.rect(screen, pixel.color, (x, y, d, d))
    else:
        for pixel in pixels:
            pygame.draw.circle(screen, pixel.color, (int(pixel.x), int(pixel.y)), pixel.radius)
     
    global messageSurface 
    if messageSurface:
#        del pxarray
        offset = 0
        for message in messageSurface:
            screen.blit(message, (0,offset))
            offset += fontHeight

        if messageDelay <= 0:
            setMessage(None)
#        pxarray = pygame.PixelArray (screen)
    if config.fpsEnabled:
        currentFps = clock.get_fps()
        fpsSurface = font.render("FPS: %d" % currentFps, False, (255,255,255)) 
        screen.blit(fpsSurface, (0, config.screenSize[1] - fontHeight))

    # Draw mouse pointer
    for mouse in mice.get_mice():
        if not mouse.connected:
            continue
        target = [mouse.x, mouse.y]
        pointerColor = pointerColors[action[mouse.index]]
        pygame.draw.line(screen, pointerColor, ( target[0] - 5, target[1] - 5), ( target[0] + 5, target[1] + 5 ))
        pygame.draw.line(screen, pointerColor, ( target[0] + 5, target[1] - 5 ), ( target[0] - 5, target[1] + 5 ))


def logic():
    # Apply forces
    for mouse in mice.get_mice():
        for pixel in pixels:
            # Apply action forces
            if action[mouse.index]:
                vector = ( mouse.x - pixel.x, mouse.y - pixel.y )
                # normalize the vector
                length = math.sqrt(vector[0] ** 2 + vector[1] ** 2)
                vector = (vector[0] / length, vector[1] / length)
                strength = length / 10.0
                if strength > 1.0:
                    strength = 1.0
                pixel.colorChange = strength

                if action[mouse.index] == 3:
                    # circle force
                    pixel.vx -= vector[1] * strength
                    pixel.vy += vector[0] * strength

                    #pixel.vx += vector[0] * strength
                    #pixel.vy += vector[1] * strength
                else:
                    # attraction or repulsion
                    if action == 2:
                        strength = -strength
                    pixel.vx += vector[0] * strength
                    pixel.vy += vector[1] * strength

    # Apply gravity and Move balls    
    for pixel in pixels:
        if config.weightEnabled:
            weight = pixel.weight
        else:
            weight = 1.0
        # Apply gravity
        if config.gravityEnabled:
            pixel.vx += gravity[0] * weight
            pixel.vy += gravity[1] * weight
        # Apply friction
        pixel.vx /= config.friction
        pixel.vy /= config.friction

        # Move ball
        pixel.x += pixel.vx
        pixel.y += pixel.vy
        if pixel.x + pixel.radius > maxX:
            pixel.x = 2 * maxX - pixel.x - 2 * pixel.radius
            pixel.vx = -pixel.vx * config.ejection
        elif pixel.x - pixel.radius < 0:
            pixel.x = 2 * pixel.radius - pixel.x
            pixel.vx = -pixel.vx * config.ejection
        if pixel.y + pixel.radius > maxY:
            pixel.y = 2 * maxY - pixel.y - 2 * pixel.radius
            pixel.vy = -pixel.vy * config.ejection
        elif pixel.y - pixel.radius < 0:
            pixel.y = 2 * pixel.radius - pixel.y
            pixel.vy = -pixel.vy * config.ejection

        if config.colorFade:
            for i in range(2): # only to yellow
                c = pixel.currentcolor[i] + pixel.colorChange
                if c > 255:
                    c = 255
                elif c < pixel.originalcolor[i]:
                    c = pixel.originalcolor[i]
                pixel.currentcolor[i] = c
            pixel.color = (int(pixel.currentcolor[0]),int(pixel.currentcolor[1]),int(pixel.currentcolor[2]))
            pixel.colorChange -= 0.01


    global messageDelay
    if messageDelay > 0:
        messageDelay -= 1

def setMessage(message, milliseconds=5000):
    global messageSurface
    global messageDelay
    if messageSurface:
        for surface in messageSurface:
            del surface

    if message:
        lines = message.split("\n")
        messageSurface = []
        for line in lines:
            messageSurface.append( font.render(line, False, (255,255,255)) )
        messageDelay = milliseconds * config.fps / 1000
    else:
        messageDelay = 0
        messageSurface = None

def generateParticle():
    if config.colorList:
        color = config.colorList[random.randint(0,len(colorList) - 1)]
    else:
        color = (random.randint(20,200),random.randint(20,200),random.randint(20,200))
    return Pixel(
                random.randint(0,config.screenSize[0] - 1),
                random.randint(0,config.screenSize[1] - 1),
                color,
                random.randint(config.minRadius,config.maxRadius)
                )

def setNumParticles(num):
    global pixels
    global config
    if config.particleCount == num:
        return
   
    if num < 0:
        num = 0
 
    if num > len(pixels):
        while num > len(pixels):
            pixels.append(generateParticle())
    elif num < len(pixels):
        while num < len(pixels):
            pixel = pixels.pop()
            del pixel
    config.particleCount = len(pixels)

config = Config()
if config.accelerometerEnabled:
    from accelerometer import Accelerometer
    try:
        accelerometer = Accelerometer()
    except:
        print "Accelerometer not found, disabling"
        accelerometer = None
        config.accelerometerEnabled = False

mice.init(config.screenSize[0], config.screenSize[1])
pygame.init() 
initDisplay()

if config.fullscreen:
    pygame.event.set_grab(True)

action = [0] * len(mice.get_mice())
bkg_color = (0, 0, 0)
clock = pygame.time.Clock()
maxX = config.screenSize[0] - 1
maxY = config.screenSize[1] - 1
terminated = False

font = pygame.font.SysFont('serif', 12)
fontHeight = font.get_height()
messageSurface = None
messageDelay = 0

helpMessage = "Help:\n\
    Left mouse button: attract\n\
    Right mouse button or left mouse button + Shift: repulse\n\
    Middle mouse button or left mouse button + Ctrl: apply rotation\n\
    Alt+Enter: toggle fullscreen\n\
    Arrow up: +100 particles\n\
    Arrow down: -100 particles\n\
    Shift + Arrow up: +10 particles\n\
    Shift + Arrow down: -10 particles\n\
    B: toggle box mode\n\
    C: toggle color fading\n\
    F: toggle FPS display\n\
    G: toggle gravity\n\
    W: toggle weight\n\
    Q or Escape: quit"

gravity = config.gravity

#pxarray = pygame.PixelArray (screen)
pixels = []
for i in range(config.particleCount):
    pixels.append(generateParticle())

setMessage("%d particles\nPress H for help" % config.particleCount)

pygame.mouse.set_visible(False)
pointerColors = [
    (255, 255, 255),
    (0, 255, 0),
    (255, 0, 0),
    (0, 0, 255)
]

frameNumber = 0
while not terminated : 
    mice.update(config.screenSize[0], config.screenSize[1])
    input(pygame.event.get()) 
    logic()
    render()
    if config.videoOut:
        pygame.image.save(screen, config.videoOut % frameNumber)
        frameNumber += 1
    pygame.display.flip()
    clock.tick(config.fps)

mice.quit()
pygame.quit() 
