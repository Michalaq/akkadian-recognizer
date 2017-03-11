from flask import Flask
from flask import render_template
from PIL import Image
from io import BytesIO
import base64

from flask import request

app = Flask(__name__)


@app.route('/save', methods=['POST'])
def save():
    img = (request.form['imgBase64']).replace('data:image/png;base64,', '')
    im = Image.open(BytesIO(base64.b64decode(img)))
    return 'dupa'


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run()
