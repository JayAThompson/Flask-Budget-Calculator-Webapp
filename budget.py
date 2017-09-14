# -*- coding: utf-8 -*-
"""

"""

from flask import Flask, render_template, json
from flask_restful import reqparse, abort, Api, Resource
import sys

app = Flask(__name__)
api = Api(app)

app.config.update(dict(SEND_FILE_MAX_AGE_DEFAULT=0)) #necessary?

cats = [{"category":"Uncategorized",
         "limit": None}]

purchases = list()

parser = reqparse.RequestParser()
parser.add_argument('catName', type=str)
parser.add_argument('catVal', type=float)
parser.add_argument('purchDate')
parser.add_argument('thePurchase', type=str)
parser.add_argument('paidOut', type=float)

this = sys.modules[__name__]

@app.route("/")
def rootPage():
	return render_template("homepage.html")


class Categories(Resource):
    def get(self):
        return cats
    
    def post(self):
        args = parser.parse_args()
        cats.append({"category":args['catName'], 
                     "limit": float(args['catVal'])})
        return cats[-1], 201
    
    def delete(self):
        
        args = parser.parse_args()
        if args['catName'] != "Uncategorized":
            for index, cat in enumerate(cats):
                for key, val in cat.items():
                    if val == args['catName']:
                        this.cats.pop(index)
                    
        return this.cats, 200
    

class Purchases(Resource):
    def get(self):
        return purchases
    
    #Can't delete uncategorized but 
    def post(self):
        args = parser.parse_args()
        purchases.append(
            {
             'category': args['catName'],
             'date': args['purchDate'],
             'purchased': args['thePurchase'],
             'amtPaid': args['paidOut']
            })
        return purchases, 201
    
api.add_resource(Categories, '/cats')
api.add_resource(Purchases, '/purchases')


if __name__ == '__main__':
	app.run(debug=True)
