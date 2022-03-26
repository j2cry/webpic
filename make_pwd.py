import bcrypt

inp = input('> ').encode()
salt = bcrypt.gensalt(rounds=5)
pwd = bcrypt.hashpw(inp, salt)
print(pwd)
