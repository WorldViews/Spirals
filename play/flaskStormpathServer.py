
from flask.ext.stormpath import StormpathManager

app = Flask(__name__)
stormpath_manager = StormpathManager(app)

from flask import Flask, render_template
#from flask.ext.sqlalchemy import SQLAlchemy
#from flask.ext.security import Security, SQLAlchemyUserDatastore, \
#    UserMixin, RoleMixin, login_required

# Create app
app = Flask(__name__)

app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'super-secret'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
app.config['SECURITY_REGISTERABLE'] = True


app.config['SECRET_KEY'] = 'someprivatestringhere'
#app.config['STORMPATH_API_KEY_FILE'] = 'apiKey.properties'
app.config['STORMPATH_API_KEY_FILE'] = 'apiKey-50NPMOSIXCG5YSC3JY4WSTTFL.properties'
app.config['STORMPATH_APPLICATION'] = 'myapp'

#API Key ID: 1924KAYNMR536MUPDSVOTZU66
#API Key Secret: 4GkmaDpIMGC4UEfHD0y15tBjXQLaSX3mIf7tuvMwsIA

