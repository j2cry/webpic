import base64
import pathlib
import configparser
import os
import pickle
import numpy as np
import cv2 as cv
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename

# read configuration file
config = configparser.ConfigParser()
config.read('webpic.conf')
HOST = config['URLS']['host']
PORT = int(config['URLS']['port'])
SERVICE_URL = pathlib.Path('/', config['URLS']['service']).as_posix()
UPLOAD_FOLDER = config['FOLDERS']['upload']
REDIRECT_ON_SAVE = int(config['BEHAVIOR']['redirect_on_save'])

# prepare template parameters
url = {
    'home': SERVICE_URL,
}

# prepare Flask
app = Flask(__name__, static_url_path=f'{SERVICE_URL}/static')
app.config['SECRET_KEY'] = os.urandom(40).hex()
sock = SocketIO(app)

# prepare folders
if not pathlib.Path(UPLOAD_FOLDER).exists():
    os.mkdir(UPLOAD_FOLDER)


def get_page(page, **kwargs):
    return render_template('index.jinja2', url=url, page=page, **kwargs)


# Flask routes
@app.route(SERVICE_URL)
def index():
    return get_page('library.jinja2')


@app.route(f'{SERVICE_URL}/upload', methods=['GET', 'POST'])
def upload():
    """ GET: Show upload page
        POST: Receive new images and contours from client """
    if request.method == 'GET':
        return get_page('upload.jinja2')
    elif request.method == 'POST':
        # check incoming data
        source_file = request.files.get('source_file', None)
        filtered_image_data = request.form.get('filtered_image_data', None)
        if not (source_file and filtered_image_data) or not source_file.filename:
            return 'No file selected'
        # save images
        filename = secure_filename(source_file.filename)
        source_file.save(pathlib.Path(UPLOAD_FOLDER, f'source_{filename}').as_posix())
        with open(pathlib.Path(UPLOAD_FOLDER, f'mask_{filename[:filename.rindex(".")]}.png').as_posix(), 'wb') as fd:
            fd.write(base64.decodebytes(filtered_image_data.split(',')[1].encode()))

        return redirect(SERVICE_URL) if REDIRECT_ON_SAVE else 'ok'


@app.route(f'{SERVICE_URL}/<path>')
def coloring(path: str):
    return get_page('coloring.jinja2')


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


@sock.on('connect')
def connect():
    sid = getattr(request, 'sid')
    print(f'sid={sid} connected')


if __name__ == '__main__':
    sock.run(app, host=HOST, port=PORT)
