# step two of three.
# Step one was to run scrape_sample_papers_from_ads.py
# Step three is to run create_papers_datafile.py
# this script scrapes the lunar sample curation website for excel data docs for each sample number listed in the geoData.csv file

__author__ = 'Feist'
import pandas as pd
import requests
import re
import os.path

import csv

outputFilePath = "./curation_papers/"

# get list of all samples to search for
inputFilePath = "../_webroot/indexes/geoData.csv"
csv.register_dialect('pipes', delimiter='|', doublequote=True, escapechar='\\')
reader = csv.reader(open(inputFilePath, "rU"), dialect='pipes')

sampleArray = []
for row in reader:
    if len(row[5]) > 0:
        curr_samples = row[5].split("`")
        for curr_sample in curr_samples:
            sampleArray.append(curr_sample)

sampleArray.sort()

# sampleArray = ["74243"]
# sampleArray = ["70017"]
sampleArray = ["78236"]


def xstr(s):
    if s is None:
        return ''
    return str(s)


for sampleNum in sampleArray:
    if not os.path.isfile(outputFilePath + sampleNum + ".csv"):
        papers_text_records = ""
        # check if the excel doc url returns a result.
        page = requests.get('https://curator.jsc.nasa.gov/lunar/references/search_results.cfm?type=xcel&samplename=' + sampleNum)
        if page.text[2:9] != 'doctype':  # this means there's no excel data for this sample number
            # get excel doc
            df = pd.read_excel('https://curator.jsc.nasa.gov/lunar/references/search_results.cfm?type=xcel&samplename=' + sampleNum)
            for index, row in df.iterrows():
                # print(row.Title)
                papers_text_records = papers_text_records + "|"  # Bibnum
                papers_text_records = papers_text_records + xstr(row.PublicationYear) + "|"
                papers_text_records = papers_text_records + xstr(row.Title) + "|"
                papers_text_records = papers_text_records + xstr(row.Authors) + "|"
                papers_text_records = papers_text_records + xstr(row.Journal) + "|"
                papers_text_records = papers_text_records + xstr(row.Volume) + "|"
                papers_text_records = papers_text_records + "|"  # Issue
                papers_text_records = papers_text_records + xstr(row.Pages) + "|"
                papers_text_records = papers_text_records + "|"  # Abstract
                papers_text_records = papers_text_records + xstr(row.DOI)
                papers_text_records = papers_text_records + "\n"
            print(sampleNum)
        else:
            print("No excel: " + sampleNum)

        outputFile = open(outputFilePath + sampleNum + ".csv", "w")
        outputFile.write(papers_text_records)
        outputFile.close()
print("done")
