# step two of two to generate papers datafile
# creates a list of papers and pivots all samples referenced by a given paper and make a delimited list of those sample numbers for each paper

import os
import csv
import operator

adsPaperArray = []
dedupedAdsPaperArray = []
curationPaperArray = []
masterPaperArray = []

inputFilePath = "./ads_papers/"
outputFilePath = "../_webroot/indexes/paperData.csv"
for filename in os.listdir(inputFilePath):
    print(filename)
    if filename[-4:] == ".csv":
        fileReader = csv.reader(open(inputFilePath + filename, "rU"), delimiter='|')
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

# pivot found papers to list all samples referenced within a given paper and add that sample list to the end of each paper record
seen = set()
uniq = []

for paper in adsPaperArray:
    searchBib = paper[1]
    sampleNumList = []
    for paper2 in adsPaperArray:
        if searchBib == paper2[1]:
            sampleNumList.append(paper2[0])

    paper.append('; '.join(sampleNumList))  # add samples list to last field of each paper record

    # de-dupe papers array
    if searchBib not in seen:
        uniq.append(searchBib)
        seen.add(searchBib)
        dedupedAdsPaperArray.append(paper)

# # data lunar curation records from csv file and merge it in with the ads papers found
# curationDataPath = "../../MISSION_DATA/paperData_curation_library.csv"
# curationFileReader = csv.reader(open(curationDataPath, "rU"), delimiter='|')
# firstCurationRow = True
# for row in curationFileReader:
#     if firstCurationRow:
#         firstCurationRow = False
#     else:
#         tempArray = []
#         tempArray.append("") # append blank leading sample data field to match other array
#         tempArray.append(row[0])
#         tempArray.append(row[1])
#         tempArray.append(row[2])
#         tempArray.append(row[3])
#         tempArray.append(row[4])
#         tempArray.append(row[5])
#         tempArray.append(row[6])
#         tempArray.append(row[7])
#         tempArray.append(row[8])
#         tempArray.append(row[9])
#         curationPaperArray.append(tempArray)

masterPaperArray = curationPaperArray + dedupedAdsPaperArray

# sort papers by date
sortedMasterPaperArray = sorted(masterPaperArray, key=operator.itemgetter(2), reverse=True)

# write a new sample datafile
output_datafile = open(outputFilePath, "w")
output_datafile.write("")
output_datafile.close()

output_datafile = open(outputFilePath, "a")

output_datafile.write("Bibcode|Year|Title|Authors|Publication|Volume|Issue|Page|Abstract|Samples\n")
for paper in sortedMasterPaperArray:
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