# step three of three to generate papers datafile
# creates a list of papers and pivots all samples referenced by a given paper and make a delimited list of those sample numbers for each paper
# the two sources of papers are ads csv files in a subfolder, and curation csv files in a different subfolder

import os
import csv
import operator

adsPaperArray = []
dedupedAdsPaperArray = []
curationPaperArray = []
dedupedCurationPaperArray = []
masterPaperArray = []
dedupedSortedMasterPaperArray = []

# get ADS papers from csv files and concat them into a single array of arrays

inputFilePath = "./ads_papers/"
outputFilePath = "../../_website/_webroot/17/indexes/paperData.csv"
for filename in os.listdir(inputFilePath):
    print("ads: " + filename)
    if filename[-4:] == ".csv":
        fileReader = csv.reader(open(inputFilePath + filename, "rU", encoding='utf8'), delimiter='|')
        first_row = True
        for row in fileReader:
            tempArray = []
            tempArray.append(filename[:5])
            tempArray.append(row[0])
            tempArray.append(row[1])
            tempArray.append(row[2])
            tempArray.append(row[3])
            tempArray.append(row[4])
            tempArray.append(row[5])
            tempArray.append(row[6])
            tempArray.append(row[7])
            tempArray.append(row[8])
            tempArray.append(row[9])  # DOI
            adsPaperArray.append(tempArray)

# pivot found ADS papers to list all samples referenced within a given paper
# and add that sample list to the end of each paper record
seen = set()
uniq = []

for paper in adsPaperArray:
    searchBib = paper[1]
    sampleNumList = []
    for paper2 in adsPaperArray:  # find occurrences of search term, and add sample num of hits to a new field
        if searchBib == paper2[1]:
            sampleNumList.append(paper2[0])

    paper.append('; '.join(sampleNumList))  # add samples list to last field of each paper record

    # de-dupe papers array
    if searchBib not in seen:
        uniq.append(searchBib)
        seen.add(searchBib)
        dedupedAdsPaperArray.append(paper)


# get curation papers from csv files and concat them into a single array of arrays

curationInputFilePath = "./curation_papers/"
for filename in os.listdir(curationInputFilePath):
    print("curation: " + filename)
    if filename[-4:] == ".csv":
        fileReader = csv.reader(open(curationInputFilePath + filename, "rU"), delimiter='|')
        first_row = True
        for row in fileReader:
            tempArray = []
            tempArray.append(filename[:5])
            tempArray.append("" if row[0] == "nan" else row[0])
            tempArray.append("" if row[1] == "nan" else row[1])
            tempArray.append("" if row[2] == "nan" else row[2])
            tempArray.append("" if row[3] == "nan" else row[3])
            tempArray.append("" if row[4] == "nan" else row[4])
            tempArray.append("" if row[5] == "nan" else row[5])
            tempArray.append("" if row[6] == "nan" else row[6])
            tempArray.append("" if row[7] == "nan" else row[7])
            tempArray.append("" if row[8] == "nan" else row[8])
            tempArray.append("" if row[9] == "nan" else row[9])  # DOI
            curationPaperArray.append(tempArray)

# pivot found curation papers to list all samples referenced within a given paper
# and add that sample list to the end of each paper record
seen = set()
uniq = []

for paper in curationPaperArray:
    searchTerm = paper[2] + paper[3]  # year plus title is unique key
    sampleNumList = []
    for paper2 in curationPaperArray:  # find occurrences of search term, and add sample num of hits to a new field
        if searchTerm == paper2[2] + paper2[3]:
            sampleNumList.append(paper2[0])

    paper.append('; '.join(sampleNumList))  # add samples list to last field of each paper record

    # de-dupe papers array
    if searchTerm not in seen:
        uniq.append(searchTerm)
        seen.add(searchTerm)
        dedupedCurationPaperArray.append(paper)


# Merge ADS and curation arrays into single array

masterPaperArray = dedupedCurationPaperArray + dedupedAdsPaperArray
# masterPaperArray = dedupedAdsPaperArray

# sort papers by date
sortedMasterPaperArray = sorted(masterPaperArray, key=operator.itemgetter(2), reverse=True)

# de-dupe master array
seen = set()
uniq = []
for paper in sortedMasterPaperArray:
    searchTerm = paper[2] + paper[3]
    if searchTerm not in seen:
        uniq.append(searchTerm)
        seen.add(searchTerm)
        dedupedSortedMasterPaperArray.append(paper)

# write a new sample datafile
output_datafile = open(outputFilePath, "w", encoding="utf-8")
output_datafile.write("")
output_datafile.close()

output_datafile = open(outputFilePath, "a", encoding="utf-8")

output_datafile.write("Bibcode|Year|Title|Authors|Publication|Volume|Issue|Page|Abstract|DOI|Samples\n")
for paper in dedupedSortedMasterPaperArray:
    output_datafile.write(paper[1] + "|" +  # bibcode
                          paper[2] + "|" +  # Year
                          paper[3] + "|" +  # Title
                          paper[4] + "|" +  # Authors
                          paper[5] + "|" +  # Publication
                          paper[6] + "|" +  # Volume
                          paper[7] + "|" +  # Issue
                          paper[8] + "|" +  # Page
                          "" + "|" +  # skip 9 which is abstract
                          paper[10] + "|" +  # DOI
                          paper[11] + "|" +  # Samples
                          "\n")

output_datafile.close()
print("done")
