import csv
import sys 
import re
import datetime


SECONDS_OFFSET = 0
TIMESTAMP_PARTS = 4
def GETFromTimestamp(timestamp):
    values =  re.split(" ", timestamp);
    i = 0
    days = 0
    if TIMESTAMP_PARTS > 3:
        days = int(values[i])
        i += 1
    hours = int(values[i])
    i += 1
    minutes = int(values[i])
    i += 1
    seconds = int(values[i])
    
    return str((days * 24) + hours).zfill(3) + ":" + str(minutes).zfill(2) + ":" + str(seconds).zfill(2)
    
    #return (seconds + (minutes * 60) + (hours * 60 * 60) + (days * 24 * 60 * 60)) - SECONDS_OFFSET
    

pageCounter = 8
curRow = 0

output_file_name_and_path = "F:\ApolloGit\Apollo17\Processing_Output\A17_TEC_cleaned_phase2.csv"
outputFile = open(output_file_name_and_path, "w")

callsignList = []
lastTimestamp = 0
lastTimestampStr = ""

inputFilePath = "F:\ApolloGit\Apollo17\Processing_Output\A17_TEC_cleaned.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
for row in reader:
	curRow += 1
	#if row[1].__len__() > 7:
		#print curRow
		#print "------------- Page: " + str(pageCounter) + " ::" + row[1]
	outputLine = ''
	#print(row)
	if (row[3].startswith("Tape")):
		tapeNumber = row[3]
		pageCounter += 1
		outputLine = "\n|||{0}|Page {1}\n".format(tapeNumber, pageCounter)
		#print "\t{0} - {1}".format(pageCounter, tapeNumber)
	elif row[0].startswith("Page") or row[2].startswith("Page"):
		print "-----------------------" + str(pageCounter)
	elif row[2] == '' or row[2] == 'APOLLO' or row[1] == 'APOLLO' or row[2] == 'END OF TAPE':
		pass
	elif row[0] == '':
		callsign = row[1]
		#outputLine = '|{0}|{1}\n'.format(callsign,row[2])
		outputLine = '{0}|{1}|{2}\n'.format(GETFromTimestamp(lastTimestampStr),callsign,row[2])
		pass
	else:
		callsign = row[1]
		curTimestamp = row[0].replace(' ', '')	
		if not curTimestamp > lastTimestamp:
			print 'Timestamp out of order: Page{0} Timestamp:{1}'.format(pageCounter,row[0]) 
		lastTimestamp = curTimestamp
		lastTimestampStr = row[0]
		
		#print GETFromTimestamp(row[0])
		
		outputLine = '{0}|{1}|{2}\n'.format(GETFromTimestamp(row[0]),callsign,row[2])
		pass
	#if curRow > 100:
	#	break
	outputFile.write(outputLine)
	#print outputLine
outputFile.close()