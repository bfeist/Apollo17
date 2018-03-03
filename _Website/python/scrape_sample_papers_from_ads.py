# step one of two. Step to is to run create_papers_datafile.py
# this scripts scrapes the ads database search for the term "apollo" plus a given sample number.
# the results are stored in separate csv files, one for each sample number

import ads
import csv
import os.path
ads.config.token = 'nr35B4vmxE5C7c3OigdQi1w1UuXctJBL8RJx8SJS'
outputFilePath = "./ads_papers/"

def xstr(s):
    if s is None:
        return ''
    return str(s)

# get list of all samples to search for
inputFilePath = "../_webroot/indexes/geoData.csv"
csv.register_dialect('pipes', delimiter='|', doublequote=True, escapechar='\\')
reader = csv.reader(open(inputFilePath, "rU"), dialect='pipes')

sample_numbers = []
for row in reader:
    if len(row[5]) > 0:
        curr_samples = row[5].split("`")
        for curr_sample in curr_samples:
            sample_numbers.append(curr_sample)

sample_numbers.sort()

# # check for dups (done, no dupes)
# seen = set()
# uniq = []
# dups = []
# for x in sample_numbers:
#     if x not in seen:
#         uniq.append(x)
#         seen.add(x)
#     else:
#         dups.append(x)

# get papers from ads

# sample_numbers = ['70011', '70012', '70017']

for sample_number in sample_numbers:
    if not os.path.isfile(outputFilePath + sample_number + ".csv"):
        papers = ads.SearchQuery(q='Apollo', abstract="*" + sample_number + "*", fl=['id', 'bibcode', 'title', 'author', 'year', 'pub', 'volume', 'issue', 'page', 'abstract', 'doi'], sort="year", rows=1000)
        papers_text_records = ""
        counter = 0
        for paper in papers:
            authorText = ""
            firstAuthor = True
            for auth in paper.author:
                if firstAuthor:
                    authorText = authorText + auth
                    firstAuthor = False
                else:
                    authorText = authorText + ", " + auth
            pageText = ""
            firstPage = True
            if paper.page != None:
                for pg in paper.page:
                    if firstPage:
                        pageText = pageText + pg
                        firstPage = False
                    else:
                        pageText = pageText + ", " + pg
            papers_text_records = papers_text_records + paper.bibcode + "|" + paper.year + "|" + paper.title[0] + "|" + authorText + "|" + xstr(paper.pub) + "|" + xstr(paper.volume) + "|" + xstr(paper.issue) + "|" + pageText + "|" + paper.abstract + "|" + "http://dx.doi.org/" + xstr(paper.doi[0]) + "\n"
            counter = counter + 1
        # if counter > 0:
        outputFile = open(outputFilePath + sample_number + ".csv", "w", encoding="utf-8")
        outputFile.write(papers_text_records)
        outputFile.close()
        print(sample_number)

print(papers.response.get_ratelimits())
