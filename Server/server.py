from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from sklearn import neighbors

cred = credentials.Certificate("credentials/service_account_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://server-data-0.firebaseio.com/'
})

class RequestHandler(BaseHTTPRequestHandler):
    
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        BaseHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        if(self.path == "/favicon.ico"):
            self.send_response(404)
            self.end_headers()
            return
        try:
            ref = db.reference(self.path.split("?")[0])
            arr = ref.get()

            params = {}

            json_response = {}

            if len(self.path.split("?")) > 1:
                param_arr = self.path.split("?")[1].split("&")
                for p in param_arr:
                    params[p.split("=")[0]] = p.split("=")[1]

            key = ""
            if "best" in params.keys():
                key = params["best"]

            stats = {}
            things = {"area": [], "version": []}
            for a in arr:
                if key in a.keys():
                    if a[key] not in stats.keys():
                        try:
                            stats[a[key]] = { "count": 1, "average_uptime": int(a["uptime"]) }
                        except ValueError:
                            stats[a[key]] = { "count": 1, "average_uptime": 0 }
                    else:
                        stats[a[key]]["count"] += 1
                        try:
                            stats[a[key]]["average_uptime"] += int(a["uptime"])
                        except ValueError:
                            pass
                if "area" in a.keys() and a["area"] not in things["area"]:
                    things["area"].append(a["area"])
                if "version" in a.keys() and a["version"] not in things["version"]:
                    things["version"].append(a["version"])
            for k in stats.keys():
                stats[k]["average_uptime"] /= stats[k]["count"]

            def get_version_key(el):
                return int(el.split('.')[0]), el

            things["area"].sort()
            things["version"].sort(key=get_version_key)
            
            def get_uptime(el):
                return stats[el[0]]["average_uptime"]

            gets = [[k, stats[k]["count"], round(stats[k]["average_uptime"], 3)] for k in list(stats.keys())]
            gets.sort(key=get_uptime, reverse=True)

            if len(key) > 0:
                json_response["best"] = gets[:10]

            if "guess" in params.keys():
                guess = params["guess"]

                clf = neighbors.KNeighborsClassifier(n_jobs=-1)

                xs = []
                ys = []

                for a in arr:
                    if "area" in a.keys() and "uptime" in a.keys() and "version" in a.keys():
                        if guess == "version":
                            xs.append([things["area"].index(a["area"]), a["uptime"]])
                        elif guess == "area":
                            xs.append([things["version"].index(a["version"]), a["uptime"]])
                        elif guess == "uptime":
                            xs.append([things["area"].index(a["area"]), things["version"].index(a["version"])])
                        ys.append(a[guess])

                clf.fit(xs, ys)

                prediction = ""
                if guess == "version":
                    prediction = clf.predict([[things["area"].index(params["area"]), int(params["uptime"])]])[0]
                elif guess == "area":
                    prediction = clf.predict([[things["version"].index(params["version"]), int(params["uptime"])]])[0]
                elif guess == "uptime":
                    prediction = clf.predict([[things["area"].index(params["area"]), things["version"].index(params["version"])]])[0]

                json_response["prediction"] = prediction

            self.send_response(200)
            self.end_headers()
            self.wfile.write(bytes(str(json_response).replace("'",'"'), 'utf-8'))
        except Exception as e:
            self.send_response(200)
            self.end_headers()
            _, _, exc_tb = sys.exc_info()
            self.wfile.write(bytes(str({ "error": type(e).__name__+": "+str(e).replace("'","")+" at line "+str(exc_tb.tb_lineno) }), 'utf-8'))

httpd = HTTPServer(('localhost', 4000), RequestHandler)
try:
    print("Serving starting on port 4000")
    httpd.serve_forever()
except KeyboardInterrupt:
    print("Server Closing . . .")