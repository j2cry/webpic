from flask_login import UserMixin


class WebpicUser(UserMixin):
    def __init__(self, uid):
        self.uid = uid

    def get_id(self):
        return self.uid
