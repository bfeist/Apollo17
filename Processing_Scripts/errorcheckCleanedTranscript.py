import csv
import sys 
import re

curRow = 0
prevTimestamp = 0
for curFile in [ "A17 master TEC and PAO manual merge.csv" ]:
	inputFilePath = "E:\Apollo17WIP\Processing_Output\\" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		if row[1].__len__() > 9:
			print curRow
			print "------------- timestamp too long: " + row[1]
		intTimestamp = row[1].translate(None, ":") #remove colons
		if intTimestamp != "":
			if int(intTimestamp) < prevTimestamp:
				print "Timestamp order error on line " + str(curRow)
			prevTimestamp = int(intTimestamp)
		#print(intTimestamp)
		#print outputLine
		#if curRow > 25000:
			#break
print "DONE"