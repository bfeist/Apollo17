import csv
import sys 
import re

def sterilize_token(token):
    bs0 = BadNumberSub(0, ["o","Q","O"])
    bs1 = BadNumberSub(1, ["i","J", "I","!","L","l"])
    bs4 = BadNumberSub(4, ["h"])
    bs8 = BadNumberSub(8, ["B"])
    
    tempToken = token
    
    for badSub in [ bs0, bs1, bs4, bs8 ]:
        for sub in badSub.badSubList:
            tempToken = tempToken.replace(sub, str(badSub.number))
    
    return tempToken

def scrub_timestamp(timestamp):
    values =  re.split(" ", timestamp);
    i = 0
    days = 0    
    days = sterilize_token(values[i])
    i += 1
    hours = sterilize_token(values[i])
    i += 1
    minutes = sterilize_token(values[i])
    i += 1
    seconds = sterilize_token(values[i])
    
    cleanTimestamp = days + " " + hours + " " + minutes + " " + seconds
    return cleanTimestamp
    
class BadNumberSub:
    def __init__(self, number, badSubList):
        self.number = number
        self.badSubList = badSubList

def scrub_callsign(callsign):
    if callsign == "MCC":
        callsign = "CC"
    return callsign

pageCounter = 499
curRow = 0

output_file_name_and_path = "F:\ApolloGit\Apollo17WIP\MC_Output\A17_TEC_500.999.mc"
outputFile = open(output_file_name_and_path, "w")

reader = csv.reader(open("F:\ApolloGit\Apollo17WIP\OCR Output\A17_TEC_500-999.csv", "rU"), delimiter='|')
for row in reader:
    curRow += 1
    print curRow
    outputLine = ''
    #print(row)
    if row[0].startswith("Tape") or row[2].startswith("Tape"):
    #if new page
        if row[0].startswith("Tape"):
            tapeNumber = row[0]
        if row[2].startswith("Tape") :
            tapeNumber = row[2]
            
        pageCounter += 1
        outputLine = "\n\t{0}\n\tPage {1}\n".format(tapeNumber, pageCounter)
        #print "\t{0}".format(tapeNumber, pageCounter)
    elif row[0].startswith("Page") or row[2].startswith("Page"):
        print "-----------------------" + str(pageCounter)
    elif row[2] == '' or row[2] == 'APOLLO' or row[1] == 'APOLLO' or row[2] == 'END OF TAPE':
        pass
    elif row[0] == '':
        outputLine = '{0} {1}\n'.format(scrub_callsign(row[1]),row[2]) 
    else:
        #print '{0} {1} {2}'.format(row[0],row[1],row[2]) 
        outputLine = '{0} {1} {2}\n'.format(scrub_timestamp(row[0]),scrub_callsign(row[1]),row[2])
        
    outputFile.write(outputLine)
    #print outputLine
outputFile.close()