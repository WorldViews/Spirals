
from flask import Flask, render_template
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.security import Security, SQLAlchemyUserDatastore, \
    UserMixin, RoleMixin, login_required
from flask.ext.social import Social
from flask.ext.social.datastore import SQLAlchemyConnectionDatastore

# Create app
app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'super-secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'

app.config['SOCIAL_TWITTER'] = {
    'consumer_key': 'GfrUsJpYI0Ju8tKph2I6w693Y',
    'consumer_secret': 'IJoAuKG6vFOCjx38OWy57aQiDHRrMXlde8QDAI1m5IvLRecw8i'
}

// https://api.twitter.com/1.1/

# Create database connection object
db = SQLAlchemy(app)

# Define models
roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    name = db.Column(db.String(255))
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())
    roles = db.relationship('Role', secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

class Connection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    provider_id = db.Column(db.String(255))
    provider_user_id = db.Column(db.String(255))
    access_token = db.Column(db.String(255))
    secret = db.Column(db.String(255))
    display_name = db.Column(db.String(255))
    profile_url = db.Column(db.String(512))
    image_url = db.Column(db.String(512))
    rank = db.Column(db.Integer)

# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

#Security(app, user_datastore)
social = Social(app, SQLAlchemyConnectionDatastore(db, Connection))


# Create a user to test with
@app.before_first_request
def create_user():
    db.create_all()
    user_datastore.create_user(name="Don", email='donkimber@gmail.com', password='xxx')
    user_datastore.create_user(name="kimber", email='kimber@gmail.com', password='xxx')
    db.session.commit()

# Views
@app.route('/')
@login_required
def home():
    return render_template('ind.html')

# Views
@app.route('/hello')
def hello():
    return render_template('hello.html')

@app.route('/profile')
@login_required
def profile():
    return render_template(
        'profile.html',
        content='Profile Page',
        twitter_conn=social.twitter.get_connection())

if __name__ == '__main__':
    app.run()
