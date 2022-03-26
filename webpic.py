import json
import pathlib
import configparser
import os
import hashlib
import bcrypt
from flask import Flask, render_template, request, redirect, send_from_directory, make_response
from flask_socketio import SocketIO
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from webpic_user import WebpicUser
from werkzeug.utils import secure_filename
from database import WebpicDatabase

# read configuration file
config = configparser.ConfigParser()
config.read('conf.d/webpic.cnf')
HOST = config['URLS']['host']
PORT = int(config['URLS']['port'])
SERVICE_URL = pathlib.Path('/', config['URLS']['service']).as_posix()
UPLOAD_FOLDER = config['FOLDERS']['upload']
REDIRECT_ON_SAVE = int(config['BEHAVIOR']['redirect_on_save'])
MAX_FILE_SIZE = int(config['BEHAVIOR']['max_file_size'])
USER_CAPACITY = int(config['BEHAVIOR']['user_capacity'])

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

# prepare SQL
sql_config = {
    'host': json.loads(config['SQL']['hosts']),
    'port': int(config['SQL']['port']),
    'database': config['SQL']['database'],
    'username': config['SQL']['username'],
    'password': config['SQL']['password'],
    'ssl_ca': config['SQL']['ssl_ca'],
    'ssl_cert': config['SQL']['ssl_cert'],
    'ssl_key': config['SQL']['ssl_key'],
}
sql = WebpicDatabase(**sql_config)
if not sql.pool:
    exit('Fatal SQL connection error')

# if not sql.set_user({'name': 'testuser', 'pwd': b'$2b$05$uC95hBzzqrpj8crkUvjZVuW8S0loOgwKFc63FntZjzr9HxXMOMWAe'}):
#     print('failed')
# exit('breakpoint')


def get_page(page, **kwargs):
    return render_template('index.jinja2', common=common, page=page, **kwargs)


@login_manager.user_loader
def load_user(user_id):
    return WebpicUser(user_id)


# ============================= Flask routes =============================
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
        password = request.form.get('password', '').encode()
        remember = bool(request.form.get('remember', False))
        register = bool(request.form.get('register', False))
        if not username:
            return {'fail': 'Username cannot be empty'}
        if not password:
            return {'fail': 'Password cannot be empty'}

        user_settings = sql.get_user(username)
        if register ^ bool(user_settings):
            if register:
                sql.set_user({'name': username, 'pwd': password})
                user_settings = sql.get_user(username)
            elif not user_settings['active']:
                return {'fail': 'This account is disabled'}
        else:
            return {'fail': 'User already exists' if user_settings else 'Wrong username or password'}

        hash_pwd = bcrypt.hashpw(password, user_settings['pwd'][:29])
        if hash_pwd != user_settings['pwd']:
            return {'fail': 'Wrong username or password'}

        user = WebpicUser(user_settings['name'])
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
        source_image = request.files.get('source', None)
        filters = json.loads(request.form.get('filters', {}))

        if not (source_image and filters) or not source_image.filename:
            return make_response({'fail': 'No file selected'})

        source_image_text = source_image.read()
        file_size = len(source_image_text)
        if file_size > MAX_FILE_SIZE:
            return make_response({'fail': 'The max. allowed file size has been exceeded.'})

        # get user path
        user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
        if not user_path.exists():
            os.mkdir(user_path.as_posix())
        else:
            current_user_capacity = sum([os.path.getsize(user_path.joinpath(fn).as_posix())
                                         for fn in os.listdir(user_path.as_posix())])
            if current_user_capacity + file_size > USER_CAPACITY:
                return make_response({'fail': 'The max. storage capacity has been reached.'})
        # parse filename and save
        sfn = secure_filename(source_image.filename)
        _, ext = os.path.splitext(sfn)
        hash_name = hashlib.sha256(sfn.encode()).hexdigest()
        image_path = user_path.joinpath(f'{hash_name}{ext}')
        filters_path = user_path.joinpath(f'{hash_name}.json')
        with open(image_path.as_posix(), 'wb') as f:
            f.write(source_image_text)
        json.dump(filters, open(filters_path.as_posix(), 'w'))
        return redirect(SERVICE_URL) if REDIRECT_ON_SAVE else {'ok': ''}


@app.route(f'{SERVICE_URL}/images/<username>/<filename>')
@login_required
def get_image_at(username, filename):
    """ Return images ONLY for current user
        You are not allowed to browse images of another user
    """
    if secure_filename(current_user.get_id()) != username:
        return get_page('error.jinja2', error_text="You are not allowed to view another user's files")
    return send_from_directory(pathlib.Path('images', secure_filename(username)).as_posix(), filename)


@app.route(f'{SERVICE_URL}/<hash_name>')
@login_required
def coloring(hash_name):
    user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
    files = [f for f in os.listdir(user_path.as_posix()) if f.startswith(hash_name)]
    if len(files) != 2:
        return get_page('error.jinja2', error_text='Image is corrupted')

    # return get_page('coloring.jinja2', files={'source': source_url, 'filter': filter_url})
    return get_page('coloring.jinja2')


@app.route(f'{SERVICE_URL}/about')
def about():
    with open('about.txt', 'r') as f:
        about_text = f.read()
    return get_page('error.jinja2', error_text=about_text)


# ============================= socket routes =============================
@sock.on('get_library')
@login_required
def on_get_library():
    """ Collect and return files list for current user
        Source file will be returned only if it has filter-file pair
    """
    user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
    if not user_path.exists():
        return []
    files = {os.path.splitext(f) for f in os.listdir(user_path.as_posix())}
    filters = [fn for fn, ext in files if ext == '.json']
    actual = [pathlib.Path('/', SERVICE_URL, user_path, f'{name}{ext}').as_posix()
              for name, ext in files if (name in filters) and (ext != '.json')]

    return actual


@sock.on('remove_images')
@login_required
def on_remove_images(hash_files):
    """ Remove selected files and its ghosts """
    user_path = pathlib.Path('images', secure_filename(current_user.get_id()))
    # collect files by hash name and remove
    for existing_file in os.listdir(user_path.as_posix()):
        for hash_name in hash_files:
            if existing_file.startswith(hash_name):
                os.remove(user_path.joinpath(existing_file).as_posix())


@sock.on('get_coloring_data')
@login_required
def on_get_coloring_data(hash_name):
    user_path = pathlib.Path(UPLOAD_FOLDER, secure_filename(current_user.get_id()))
    files = [f for f in os.listdir(user_path.as_posix()) if f.startswith(hash_name)]

    # parse file names
    filters_file = hash_name + '.json'
    files.remove(filters_file)
    image_file = files.pop()
    # parse paths
    source_url = pathlib.Path('/', SERVICE_URL, user_path, image_file).as_posix()
    filters = json.load(open(user_path.joinpath(filters_file).as_posix(), 'r'))
    return {'source': source_url, 'filters': filters}


@sock.on('connect')
def connect():
    sid = getattr(request, 'sid')
    print(f'sid={sid} connected')


if __name__ == '__main__':
    sock.run(app, host=HOST, port=PORT)
