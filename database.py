from functools import wraps
from mysql.connector import errors
from mysql.connector.pooling import MySQLConnectionPool


def reconnect_from_pool(func):
    """ Get SQL connection from pool if the previous was closed or broken """
    @wraps(func)
    def wrapped(*args, **kwargs):
        self = args[0]
        try:
            self.cursor.execute('SELECT 1')
            self.cursor.fetchall()
        except errors.DatabaseError:
            self.cursor.close()
            self.connection.close()
            self.connection = self.pool.get_connection()
            self.cursor = self.connection.cursor()
        return func(*args, **kwargs)
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
                self.pool = MySQLConnectionPool(pool_name=self.POOL_NAME, pool_size=1,
                                                host=host, **config)
                print(f'SQL: connected on {host}')
                break
            except (errors.PoolError, errors.DatabaseError):
                print(f'SQL: connection on {host} failed')
        self.connection = self.pool.get_connection()
        self.cursor = self.connection.cursor()

    @reconnect_from_pool
    def get_user(self, name):
        self.cursor.execute('SELECT * FROM user WHERE name = %s', params=(name, ))
        response = self.cursor.fetchall()
        if not response:
            return None
        fields = [field[0] for field in self.cursor.description]
        result = {k: v.encode() if k == 'pwd' else v for k, v in zip(fields, response[0])}
        return result
