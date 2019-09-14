__author__ = 'Feist'
# import requests

import csv

def convertCSVDatafile(inputFile):
    reader = csv.reader(open(inputFile, "rU"), delimiter=',')
    resultList = []
    for row in reader:
        if "Series 1:" not in row[0]:
            tempItem = []
            # print row
            #reformat GET
            hoursArray = row[0].split(".")
            hours = int(hoursArray[0])
            minutes = (60 * (float("." + hoursArray[1]) * 100)) / 100
            minutesArray = str(minutes).split(".")
            minutes = int(minutesArray[0])
            seconds = (60 * (float("." + minutesArray[1]) * 100)) / 100
            seconds = int(seconds)

            #reformat bpm
            bpm = int(round(float(row[1])))
            tempItem.append("%03d:%02d:%02d" % (hours, minutes, seconds))
            tempItem.append(bpm)
            resultList.append(tempItem)
    return resultList


inputFilePath = "../MISSION_DATA/Archive/apollo_heart_rate_data/"
outputFilePath = "../_Website/_webroot/indexes/"

cdrHRFiles = ['DESCENT_CDR.csv', 'EVA1_CDR.csv', 'EVA2_CDR.csv', 'EVA3_CDR.csv', 'ASCENT_CDR.csv']
lmpHRFiles = ['EVA1_LMP.csv', 'EVA2_LMP.csv', 'EVA3_LMP.csv']

#heart rate data conversion
cdrHRList = []
for inputFilename in cdrHRFiles:
    cdrHRList.extend(convertCSVDatafile(inputFilePath + inputFilename))

lmpHRList = []
for inputFilename in lmpHRFiles:
    lmpHRList.extend(convertCSVDatafile(inputFilePath + inputFilename))


with open(outputFilePath + 'heartrates_CDR.csv', 'w') as csvFile:
    writer = csv.writer(csvFile, delimiter='|', lineterminator='\n')
    for item in cdrHRList:
        writer.writerow(item)
csvFile.close()

with open(outputFilePath + 'heartrates_LMP.csv', 'w') as csvFile:
    writer = csv.writer(csvFile, delimiter='|', lineterminator='\n')
    for item in lmpHRList:
        writer.writerow(item)
csvFile.close()


#met rate data conversion
cdrMetrateFiles = ['EVA1_CDR_met.csv', 'EVA2_CDR_met.csv', 'EVA3_CDR_met.csv']
lmpMetrateFiles = ['EVA1_LMP_met.csv', 'EVA2_LMP_met.csv', 'EVA3_LMP_met.csv']

cdrMetrateList = []
for inputFilename in cdrMetrateFiles:
    cdrMetrateList.extend(convertCSVDatafile(inputFilePath + inputFilename))

lmpMetrateList = []
for inputFilename in lmpMetrateFiles:
    lmpMetrateList.extend(convertCSVDatafile(inputFilePath + inputFilename))


with open(outputFilePath + 'metrates_CDR.csv', 'w') as csvFile:
    writer = csv.writer(csvFile, delimiter='|', lineterminator='\n')
    for item in cdrMetrateList:
        writer.writerow(item)
csvFile.close()

with open(outputFilePath + 'metrates_LMP.csv', 'w') as csvFile:
    writer = csv.writer(csvFile, delimiter='|', lineterminator='\n')
    for item in lmpMetrateList:
        writer.writerow(item)
csvFile.close()