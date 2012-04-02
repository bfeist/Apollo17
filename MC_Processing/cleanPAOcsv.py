import csv
import sys 
import re

def scrub_callsign(callsign):
	#callsign = callsign.upper()
	callsign = callsign.strip()
	if callsign == "MCC":
		callsign = "CC"
	return callsign

readPageCounter = 8
curRow = 0
errorCount = 0

output_file_name_and_path = "F:\ApolloGit\Apollo17WIP\OCR Output\A17_PAO_cleaned.csv"
#outputFile = open(output_file_name_and_path, "w")

callsignList = [ "LAUNCH CNTL", "CAPCOM", "PAO", "SC", "AMERICA", "CERNAN", "SCHMITT", "CHALLENGER", "RECOVERY", "SPEAKER", "GREEN", "ECKER", "BUTTS", "JONES", "EVANS", "HONEYSUCKLE"  ]
lastTimestamp = 0

for curFile in [ "A17_PAO.csv" ]:
	inputFilePath = "F:\ApolloGit\Apollo17WIP\OCR Output\\" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		outputLine = ''
		#print row[1]
		if len(row) > 1:
			if row[1].startswith("APOLLO 17 MISSION COMMENTARY") :
				#print str(curRow) + "-----------------------" + row[1]
				readPageCounter += 1
			elif row[1].startswith("END OF TAPE"):
				pass
			else:
				if any(row[0].startswith(curCallsign) for curCallsign in callsignList):
					#print "-----------------------" + "Callsign Found.\n"
					pass
				else:
					print str(curRow) + "-----------------------" + "Callsign Not Found. " + str(len(row)) + " " + str(row[0])
					errorCount += 1
				#print row
				#outputLine = '{0}|{1}|{2}\n'.format(scrub_timestamp(row[0]),scrubbedCallsign,row[2])
				pass
		else:
			#print str(curRow) + " has only one element: " + row[0]
			pass
		
		if errorCount > 200:
			break
			
		#outputFile.write(outputLine)
		#print outputLine
#outputFile.close()