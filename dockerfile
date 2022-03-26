FROM python:3.9-slim
MAINTAINER fragarie 'fragarie@yandex.com'

RUN python3 -m venv /webpic_app/venv
COPY requirements.txt /webpic_app/
RUN /webpic_app/venv/bin/pip3 install -r /webpic_app/requirements.txt
COPY . /webpic_app/
WORKDIR /webpic_app

ENTRYPOINT ["/webpic_app/venv/bin/python3", "webpic.py"]