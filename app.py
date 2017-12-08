#!/usr/bin/env python3

import datetime
import pathlib

import flask
import peewee


HERE = pathlib.Path(__file__).resolve().parent
CST = datetime.timezone(datetime.timedelta(hours=8))  # China Standard Time

app = flask.Flask(__name__)
db = peewee.SqliteDatabase(str(HERE / 'data.db'))


class Stats(peewee.Model):
    timestamp = peewee.IntegerField()
    views = peewee.IntegerField()
    posts = peewee.IntegerField()
    followers = peewee.IntegerField()

    class Meta:
        database = db


db.create_tables([Stats], safe=True)


@app.route('/csv/')
def csv():
    resp = 'timestamp_ms,datetime,views,posts,followers\n'
    for stats in Stats.select().order_by(Stats.timestamp.desc()):
        resp += '%d,%s,%d,%d,%d\n' % (
            stats.timestamp,
            datetime.datetime.fromtimestamp(int(stats.timestamp / 1000), tz=CST).isoformat(),
            stats.views,
            stats.posts,
            stats.followers,
        )
    return flask.Response(resp, mimetype='text/plain')


def main():
    app.run(debug=True)


if __name__ == '__main__':
    main()
