from flask import Flask
from flask import render_template
from PIL import Image
from io import BytesIO
import base64
import json
from match import search

from flask import request

app = Flask(__name__)

with open('piska.txt', 'r') as f:
    lines = f.readlines()
    lines = list(map(lambda x: x.strip().split(' ', 2), lines))
    lines = [ (row[0], row[-1]) for row in lines]
    lookup = dict(lines)

@app.route('/info', methods=['GET'])
def info():
    print('yo!')
    idx = request.args.get('idx')
    response = app.response_class(
        response=lookup[idx],
        status=200,
        mimetype='application/json'
    )
    return response

def load_base64(result):
    with open('pics/{}.png'.format(result), 'rb') as f:
        data = f.read()
        return data.encode('base64')

@app.route('/save', methods=['POST'])
def save():
    img2 = request.form['imgBase64']
    img = (request.form['imgBase64']).replace('data:image/png;base64,', '')
    s = request.form['json_string']
    s = json.loads(s)
    results = search(s, 5)
    matches = [{'desc': lookup[result] if result in lookup else None, 'imgBase64': load_base64(result)} for result in results]
    im = Image.open(BytesIO(base64.b64decode(img)))
    print(im)
    return render_template('res.html', templ={'imgBase64': img2}, matches=matches)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run()
