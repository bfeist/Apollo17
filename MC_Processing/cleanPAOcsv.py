import csv
import sys 
import re
import os


def scrub_callsign(callsign):
	#callsign = callsign.upper()
	callsign = callsign.strip()
	if callsign == "MCC":
		callsign = "CC"
	return callsign

readPageCounter = 1
curRow = 0
errorCount = 0
newTimestamp = 0

output_file_name_and_path = "F:\ApolloGit\Apollo17WIP\OCR Output\A17_PAO_cleaned.csv"
outputFile = open(output_file_name_and_path, "w")
outputLine = ""
pageTitle = ""

callsignList = [ "LAUNCH CNTL", "CAPCOM", "PAO", "SC", "AMERICA", "CERNAN", "SCHMITT", "CHALLENGER", "RECOVERY", "SPEAKER", "GREEN", "ECKER", "BUTTS", "JONES", "EVANS", "HONEYSUCKLE"  ]


for curFile in [ "A17_PAO.csv" ]:
	inputFilePath = "F:\ApolloGit\Apollo17WIP\OCR Output\\" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		#print row[1]
		if len(row) > 1:
			if row[1].startswith("APOLLO 17 MISSION COMMENTARY") :
				#pageTitle = "||" + row[1] + "|Page " + str(readPageCounter)
				pageTitle = "||" + row[1]
				readPageCounter += 1
				
				cstTimeStr = row[1][row[1].index("CST") + 4:row[1].index("CST") + 10]
				getTimeStr = row[1][row[1].index("GET") + 4:row[1].index("GET") + 10]
				if getTimeStr.find("/") != -1 or getTimeStr.find("MC") != -1 or cstTimeStr.find("/") != -1 or cstTimeStr.find("MC") != -1:
					#time must be to the left of 'GET'
					getTimeStr = row[1][row[1].index("GET") -8 :row[1].index("GET")]
				getTimeStr = max(getTimeStr.strip().split(" "), key=len).replace(",","").zfill(6) #strip longest list item and remove commas - this is the timestamp
				print str(curRow) + " " + getTimeStr
				#outputFile.write("TIMESTAMP|" + row[1] + "\n")
				newTimestamp = 1
				
			elif row[1].startswith("END OF TAPE"):
				pass #delete END OF TAPE rows
			else:
				if any(row[0].startswith(curCallsign) for curCallsign in callsignList):
					#print "-----------------------" + "Callsign Found.\n"
					outputFile.write("\n")
					if newTimestamp == 1 :
						outputLine = pageTitle + "\n" #print the complete typed pages title
						outputLine += '{0}|{1}|{2}'.format(getTimeStr,row[0],row[1]) #print the first dialogue with the timestamp from the title
						newTimestamp = 0
					else :
						outputLine = '|{0}|{1}'.format(row[0],row[1]) #print a regular line of dialog with callsign
				else:
					print str(curRow) + "-----------------------" + "Callsign Not Found. " + str(len(row)) + " " + str(row)
					errorCount += 1
				#print row
				#print outputLine
				pass
		else:
			#--only one record, so it must be a continuation of the previous line
			outputLine += ' ' + row[0]
			#print str(curRow) + " concatted line: " + outputLine
			pass
		
		#if readPageCounter % 60 == 0:
		#	break
			
		outputFile.write(outputLine)
		outputLine = ""
		#print outputLine
#outputFile.close()