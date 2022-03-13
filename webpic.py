import pathlib
import configparser
import os
import pickle
import numpy as np
import cv2 as cv
from flask import Flask, render_template
from flask_socketio import SocketIO

# read configuration file
config = configparser.ConfigParser()
config.read('webpic.conf')
HOST = config['URLS']['host']
PORT = int(config['URLS']['port'])
SERVICE_URL = pathlib.Path('/', config['URLS']['service']).as_posix()

# prepare Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(40).hex()
sock = SocketIO(app)


# Flask routes
@app.route(SERVICE_URL)
def index():
    return render_template('base.jinja2')


# socket routes
@sock.on('click')
def on_canvas_click(point):
    # read contours
    contours = pickle.load(open('static/media/testpic_contours.pkl', 'rb'))
    hierarchy = np.array(pickle.load(open('static/media/testpic_hierarchy.pkl', 'rb')))
    # check max level collision
    collision = np.where(np.array([cv.pointPolygonTest(ct, point, False) for ct in contours]) >= 0)[0]
    contour_index = int(collision[hierarchy[0, collision, 3].argmax()]) if collision.size else -1
    return contours[contour_index].tolist()


if __name__ == '__main__':
    sock.run(app, host=HOST, port=PORT)
