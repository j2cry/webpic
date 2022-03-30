import bcrypt
from functools import wraps
from mysql.connector import errors
from mysql.connector.pooling import MySQLConnectionPool


def reconnect_from_pool(func):
    """ Get SQL connection from pool if the previous was closed or broken """
    @wraps(func)
    def wrapped(*args, **kwargs):
        self = args[0]
        try:
            self.connection = self.pool.get_connection()
            self.cursor = self.connection.cursor()
        except (errors.DatabaseError, errors.ProgrammingError) as e:
            print(e)
            return 'cannot establish SQL connection'
        result = func(*args, **kwargs)
        self.cursor.close()
        self.connection.close()
        return result
    return wrapped


class WebpicDatabase:
    def __init__(self, **config):
        """ Initialize database connection pool
        :keyword host_list - List of assumed SQL hosts
        :keyword port - SQL connection port
        :keyword database - SQL database name
        :keyword username - SQL user
        :keyword password - SQL user password
        :keyword ssl_cert - path to SSL certificate file (if required)
        :keyword ssl_key - path to SSL private key file (if required)
        :keyword ssl_ca - path to SSL center authority file (if required)
        """
        self.POOL_NAME = 'webpic_sql_pool'
        self.pool = None
        host_list = config.pop('host', ['localhost'])
        for host in host_list:
            try:
                self.pool = MySQLConnectionPool(pool_name=self.POOL_NAME, pool_size=5,
                                                host=host, **config)
                print(f'SQL: connected on {host}')
                break
            except (errors.PoolError, errors.DatabaseError):
                print(f'SQL: connection on {host} failed')
        if self.pool:
            self.connection = self.pool.get_connection()
            self.cursor = self.connection.cursor()

    @reconnect_from_pool
    def get_user(self, name):
        """ Get user parameters """
        self.cursor.execute('SELECT * FROM user WHERE name = %s', params=(name, ))
        response = self.cursor.fetchall()
        if not response:
            return None
        fields = [field[0] for field in self.cursor.description]
        result = {k: v.encode() if k == 'pwd' else v for k, v in zip(fields, response[0])}
        return result

    @reconnect_from_pool
    def set_user(self, data: dict):
        """ Set user parameters (create/modify user) """
        self.cursor.execute('SHOW COLUMNS FROM user')
        response = self.cursor.fetchall()
        if not response:
            return False
        unique_fields = [col[0] for col in response if col[3]]
        # encrypt password
        if pwd := data.get('pwd', None):
            salt = bcrypt.gensalt(rounds=5)
            data['pwd'] = bcrypt.hashpw(pwd, salt)
        # prepare query fillers
        field_names = ', '.join(data.keys())
        placeholder = ', '.join(['%s'] * len(data.keys()))
        update_params = ', '.join([f'{col_name} = %s' for col_name in data.keys() if col_name not in unique_fields])
        data_params = list(data.values()) + [val for col, val in data.items() if col not in unique_fields]
        # query
        try:
            self.cursor.execute(f'INSERT INTO user ({field_names}) VALUE ({placeholder}) '
                                f'ON DUPLICATE KEY UPDATE {update_params}', params=data_params)
        except errors.ProgrammingError:
            return False
        self.connection.commit()
        return True
