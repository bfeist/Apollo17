__author__ = 'Feist'
import requests
import re
import csv
import sys


inputFilePath = "../_webroot/indexes/geoData.csv"
csv.register_dialect('pipes', delimiter='|', doublequote=True, escapechar='\\')
reader = csv.reader(open(inputFilePath, "rU"), dialect='pipes')
for row in reader:
    if len(row[5]) > 0:
        curr_samples = row[5].split("`")
        for curr_sample in curr_samples:
            sys.stdout.write(curr_sample + ",")

print ("************* DONE")
