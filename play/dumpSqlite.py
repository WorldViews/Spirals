
import sqlite3

def dump():
    db = sqlite3.connect("flask-oauth.db")
    cursor = db.cursor()

    cursor.execute("SELECT * FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print "tables:", tables
    print "=============================="

    cursor.execute("SELECT * FROM sqlite_master WHERE type='table';")
    #cursor.execute("SELECT 'name' FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print "tables:", tables

    print "Tables:"
    for n in tables:
        print n[1]

    print "-----"
    for n in tables:
        name = n[1]
        print name
        com = "SELECT * FROM '%s'" % name
        print "com:", com
        cursor.execute(com)
        recs = cursor.fetchall()
        for rec in recs:
            print rec

dump()


