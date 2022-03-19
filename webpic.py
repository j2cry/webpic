import base64
import pathlib
import configparser
import os
import pickle
import numpy as np
import cv2 as cv
from flask import Flask, render_template, request, redirect, send_from_directory
from flask_socketio import SocketIO
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from webpic_user import WebpicUser
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
common = {
    'title': config['BEHAVIOR']['title'],
    'home_url': SERVICE_URL,
}

# prepare Flask
app = Flask(__name__, static_url_path=f'{SERVICE_URL}/static')
app.config['SECRET_KEY'] = os.urandom(40).hex()
sock = SocketIO(app, path=f'{SERVICE_URL}/socket.io')
login_manager = LoginManager()
login_manager.login_view = f'{SERVICE_URL}/auth'
login_manager.init_app(app)

# prepare folders
if not pathlib.Path(UPLOAD_FOLDER).exists():
    os.mkdir(UPLOAD_FOLDER)


def get_page(page, **kwargs):
    return render_template('index.jinja2', common=common, page=page, **kwargs)


@login_manager.user_loader
def load_user(user_id):
    return WebpicUser(user_id)


# Flask routes
@app.route(f'{SERVICE_URL}/auth', methods=['GET', 'POST'])
def auth():
    """ GET: Show authentication form
        POST: Authenticate user
    """
    uid = current_user.get_id()
    if uid:
        logout_user()
        print(f'Log out {uid}')

    if request.method == 'GET':
        # TODO: redirect to requested url
        return get_page('auth.jinja2')
    elif request.method == 'POST':
        # print(request.form)
        username = request.form.get('username', None)
        password = request.form.get('password', None)
        remember = bool(request.form.get('remember', False))
        # TODO: user verification
        if not username:
            return {'fail': 'Username cannot be empty'}

        user = WebpicUser(username)
        login_user(user, remember=remember)
        print(f'Log in {user.get_id()}')
        return {'success': SERVICE_URL}


@app.route(SERVICE_URL)
@login_required
def index():
    return get_page('library.jinja2')


@app.route(f'{SERVICE_URL}/upload', methods=['GET', 'POST'])
@login_required
def upload():
    """ GET: Show upload page
        POST: Receive new images and contours from client """
    if request.method == 'GET':
        return get_page('upload.jinja2')
    elif request.method == 'POST':
        # check incoming data
        source_file = request.files.get('source_file', None)
        filter_file = request.form.get('filtered_image_data', None)
        if not (source_file and filter_file) or not source_file.filename:
            return 'No file selected'
        # parse file name and path
        user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
        if not user_path.exists():
            os.mkdir(user_path.as_posix())
        filename, extension = os.path.splitext(secure_filename(source_file.filename))
        source_filename = f'{filename}_source{extension}'
        filter_filename = f'{filename}_filter.png'
        # save images
        source_file.save(pathlib.Path(user_path, source_filename).as_posix())
        with open(pathlib.Path(user_path, filter_filename).as_posix(), 'wb') as fd:
            fd.write(base64.decodebytes(filter_file.split(',')[1].encode()))

        return redirect(SERVICE_URL) if REDIRECT_ON_SAVE else 'ok'


@app.route(f'{SERVICE_URL}/images/<username>/<filename>')
@login_required
def get_image_at(username, filename):
    """ Return images ONLY for current user
        You are not allowed to browse images of another user
    """
    if secure_filename(current_user.get_id()) != username:
        return get_page('error.jinja2', error_text="You are not allowed to view another user's files")
    return send_from_directory(pathlib.Path('images', username).as_posix(), filename)


@app.route(f'{SERVICE_URL}/coloring-test')
@login_required
def coloring():
    return get_page('coloring.jinja2')


# socket routes
@sock.on('get_library')
@login_required
def on_get_library():
    """ Collect and return files list for current user
        Source file will be returned only if it has filter-file pair
    """
    user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
    if not user_path.exists():
        return []
    all_files = os.listdir(user_path.as_posix())
    filter_files = [f[:f.rindex('_')] for f in all_files if '_filter.png' in f]
    source_files = [pathlib.Path('/', SERVICE_URL, user_path, f).as_posix() for f in all_files
                    if f[:f.rindex('_')] in filter_files and '_source.' in f]
    return source_files


@sock.on('remove_images')
@login_required
def on_remove_images(files):
    """ Remove selected files """
    username = current_user.get_id()
    for source_file in files:
        if (file := pathlib.Path('images', username, source_file)).exists():
            os.remove(file.as_posix())
        _, extension = os.path.splitext(source_file)
        filter_file = source_file.replace(f'_source{extension}', '_filter.png')
        if (file := pathlib.Path('images', username, filter_file)).exists():
            os.remove(file.as_posix())


@sock.on('click')
@login_required
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
